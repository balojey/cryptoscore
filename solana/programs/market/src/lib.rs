use anchor_lang::prelude::*;

declare_id!("94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ");

#[program]
pub mod cryptoscore_market {
    use super::*;

    /// Initialize a new prediction market
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        match_id: String,
        entry_fee: u64,
        kickoff_time: i64,
        end_time: i64,
        is_public: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        // Validate match ID
        require!(!match_id.is_empty(), MarketError::InvalidMatchId);
        require!(match_id.len() <= 64, MarketError::MatchIdTooLong);
        
        // Validate entry fee
        require!(entry_fee > 0, MarketError::ZeroEntryFee);
        
        // Validate times
        let current_time = Clock::get()?.unix_timestamp;
        require!(kickoff_time > current_time, MarketError::InvalidKickoffTime);
        require!(end_time > kickoff_time, MarketError::InvalidEndTime);
        
        // Initialize market state
        market.factory = ctx.accounts.factory.key();
        market.creator = ctx.accounts.creator.key();
        market.match_id = match_id;
        market.entry_fee = entry_fee;
        market.kickoff_time = kickoff_time;
        market.end_time = end_time;
        market.status = MarketStatus::Open;
        market.outcome = None;
        market.total_pool = 0;
        market.participant_count = 0;
        market.home_count = 0;
        market.draw_count = 0;
        market.away_count = 0;
        market.is_public = is_public;
        market.bump = ctx.bumps.market;
        
        msg!("Market initialized: {}, creator: {}", 
            ctx.accounts.market.key(), ctx.accounts.creator.key());
        
        Ok(())
    }

    /// Join a market with a prediction
    pub fn join_market(
        ctx: Context<JoinMarket>,
        prediction: MatchOutcome,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let participant = &mut ctx.accounts.participant;
        
        // Validate market is open
        require!(market.status == MarketStatus::Open, MarketError::MarketNotOpen);
        
        // Validate kickoff time hasn't passed
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time < market.kickoff_time, MarketError::MarketAlreadyStarted);
        
        // Transfer entry fee from user to market
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &market.key(),
            market.entry_fee,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.user.to_account_info(),
                market.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        // Initialize participant
        participant.market = market.key();
        participant.user = ctx.accounts.user.key();
        participant.prediction = prediction.clone();
        participant.joined_at = current_time;
        participant.has_withdrawn = false;
        participant.bump = ctx.bumps.participant;
        
        // Update market stats
        market.total_pool = market.total_pool.checked_add(market.entry_fee)
            .ok_or(MarketError::PoolOverflow)?;
        market.participant_count = market.participant_count.checked_add(1)
            .ok_or(MarketError::ParticipantOverflow)?;
        
        // Update prediction counts
        match prediction {
            MatchOutcome::Home => {
                market.home_count = market.home_count.checked_add(1)
                    .ok_or(MarketError::CountOverflow)?;
            },
            MatchOutcome::Draw => {
                market.draw_count = market.draw_count.checked_add(1)
                    .ok_or(MarketError::CountOverflow)?;
            },
            MatchOutcome::Away => {
                market.away_count = market.away_count.checked_add(1)
                    .ok_or(MarketError::CountOverflow)?;
            },
        }
        
        // Emit event
        emit!(PredictionMade {
            market: market.key(),
            user: ctx.accounts.user.key(),
            prediction,
            timestamp: current_time,
        });
        
        msg!("User {} joined market with prediction: {:?}", 
            ctx.accounts.user.key(), participant.prediction);
        
        Ok(())
    }

    /// Resolve market with match outcome
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome: MatchOutcome,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        // Validate only creator can resolve
        require!(ctx.accounts.creator.key() == market.creator, MarketError::UnauthorizedResolver);
        
        // Validate market is not already resolved
        require!(market.status != MarketStatus::Resolved, MarketError::MarketAlreadyResolved);
        
        // Validate end time has passed
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time >= market.end_time, MarketError::MarketNotEnded);
        
        // Update market status and outcome
        market.status = MarketStatus::Resolved;
        market.outcome = Some(outcome.clone());
        
        // Calculate winner count
        let winner_count = match outcome {
            MatchOutcome::Home => market.home_count,
            MatchOutcome::Draw => market.draw_count,
            MatchOutcome::Away => market.away_count,
        };
        
        // Emit event
        emit!(MarketResolved {
            market: market.key(),
            outcome,
            winner_count,
            total_pool: market.total_pool,
        });
        
        msg!("Market resolved with outcome: {:?}, winners: {}", 
            market.outcome, winner_count);
        
        Ok(())
    }

    /// Withdraw rewards for winning participants
    pub fn withdraw_rewards(ctx: Context<WithdrawRewards>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let participant = &mut ctx.accounts.participant;
        
        // Validate market is resolved
        require!(market.status == MarketStatus::Resolved, MarketError::MarketNotResolved);
        
        // Validate participant hasn't withdrawn
        require!(!participant.has_withdrawn, MarketError::AlreadyWithdrawn);
        
        // Validate participant is a winner
        let outcome = market.outcome.as_ref().ok_or(MarketError::NoOutcome)?;
        require!(participant.prediction == *outcome, MarketError::NotAWinner);
        
        // Calculate winner count
        let winner_count = match outcome {
            MatchOutcome::Home => market.home_count,
            MatchOutcome::Draw => market.draw_count,
            MatchOutcome::Away => market.away_count,
        };
        
        // Validate there are winners
        require!(winner_count > 0, MarketError::NoWinners);
        
        // Calculate fees (1% creator + 1% platform = 2% total)
        let creator_fee = market.total_pool.checked_mul(100).unwrap() / 10000; // 1%
        let platform_fee = market.total_pool.checked_mul(100).unwrap() / 10000; // 1%
        let total_fees = creator_fee.checked_add(platform_fee)
            .ok_or(MarketError::CalculationError)?;
        
        // Calculate prize pool after fees
        let prize_pool = market.total_pool.checked_sub(total_fees)
            .ok_or(MarketError::CalculationError)?;
        
        // Calculate individual reward
        let reward = prize_pool.checked_div(winner_count as u64)
            .ok_or(MarketError::CalculationError)?;
        
        // Transfer reward to participant
        **market.to_account_info().try_borrow_mut_lamports()? = market
            .to_account_info()
            .lamports()
            .checked_sub(reward)
            .ok_or(MarketError::InsufficientFunds)?;
        
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .user
            .to_account_info()
            .lamports()
            .checked_add(reward)
            .ok_or(MarketError::CalculationError)?;
        
        // Mark as withdrawn
        participant.has_withdrawn = true;
        
        // Emit event
        emit!(RewardClaimed {
            market: market.key(),
            user: ctx.accounts.user.key(),
            amount: reward,
        });
        
        msg!("User {} withdrew reward: {} lamports", 
            ctx.accounts.user.key(), reward);
        
        Ok(())
    }
}

// Account Structures

#[account]
pub struct Market {
    /// Factory that created this market
    pub factory: Pubkey,
    /// Creator of the market
    pub creator: Pubkey,
    /// Match identifier
    pub match_id: String,
    /// Entry fee in lamports
    pub entry_fee: u64,
    /// Match kickoff timestamp
    pub kickoff_time: i64,
    /// Match end timestamp
    pub end_time: i64,
    /// Current market status
    pub status: MarketStatus,
    /// Match outcome (if resolved)
    pub outcome: Option<MatchOutcome>,
    /// Total pool in lamports
    pub total_pool: u64,
    /// Total number of participants
    pub participant_count: u32,
    /// Number of HOME predictions
    pub home_count: u32,
    /// Number of DRAW predictions
    pub draw_count: u32,
    /// Number of AWAY predictions
    pub away_count: u32,
    /// Whether market is public
    pub is_public: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl Market {
    pub const MAX_MATCH_ID_LEN: usize = 64;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // factory
        32 + // creator
        4 + Self::MAX_MATCH_ID_LEN + // match_id
        8 +  // entry_fee
        8 +  // kickoff_time
        8 +  // end_time
        1 +  // status
        1 + 1 + // outcome (Option<MatchOutcome>)
        8 +  // total_pool
        4 +  // participant_count
        4 +  // home_count
        4 +  // draw_count
        4 +  // away_count
        1 +  // is_public
        1;   // bump
}

#[account]
pub struct Participant {
    /// Market this participant joined
    pub market: Pubkey,
    /// User's wallet address
    pub user: Pubkey,
    /// User's prediction
    pub prediction: MatchOutcome,
    /// Timestamp when joined
    pub joined_at: i64,
    /// Whether rewards have been withdrawn
    pub has_withdrawn: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl Participant {
    pub const LEN: usize = 8 + // discriminator
        32 + // market
        32 + // user
        1 +  // prediction
        8 +  // joined_at
        1 +  // has_withdrawn
        1;   // bump
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Open,
    Live,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum MatchOutcome {
    Home,
    Draw,
    Away,
}

// Context Structures

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = Market::LEN,
        seeds = [
            b"market",
            factory.key().as_ref(),
            match_id.as_bytes()
        ],
        bump
    )]
    pub market: Account<'info, Market>,
    
    /// CHECK: Factory account that created this market
    pub factory: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMarket<'info> {
    #[account(
        mut,
        seeds = [
            b"market",
            market.factory.as_ref(),
            market.match_id.as_bytes()
        ],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = user,
        space = Participant::LEN,
        seeds = [
            b"participant",
            market.key().as_ref(),
            user.key().as_ref()
        ],
        bump
    )]
    pub participant: Account<'info, Participant>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [
            b"market",
            market.factory.as_ref(),
            market.match_id.as_bytes()
        ],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawRewards<'info> {
    #[account(
        mut,
        seeds = [
            b"market",
            market.factory.as_ref(),
            market.match_id.as_bytes()
        ],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [
            b"participant",
            market.key().as_ref(),
            user.key().as_ref()
        ],
        bump = participant.bump
    )]
    pub participant: Account<'info, Participant>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Events

#[event]
pub struct PredictionMade {
    #[index]
    pub market: Pubkey,
    #[index]
    pub user: Pubkey,
    pub prediction: MatchOutcome,
    pub timestamp: i64,
}

#[event]
pub struct MarketResolved {
    #[index]
    pub market: Pubkey,
    pub outcome: MatchOutcome,
    pub winner_count: u32,
    pub total_pool: u64,
}

#[event]
pub struct RewardClaimed {
    #[index]
    pub market: Pubkey,
    #[index]
    pub user: Pubkey,
    pub amount: u64,
}

// Error Codes

#[error_code]
pub enum MarketError {
    #[msg("Match ID cannot be empty")]
    InvalidMatchId,
    #[msg("Match ID is too long (max 64 characters)")]
    MatchIdTooLong,
    #[msg("Entry fee must be greater than zero")]
    ZeroEntryFee,
    #[msg("Kickoff time must be in the future")]
    InvalidKickoffTime,
    #[msg("End time must be after kickoff time")]
    InvalidEndTime,
    #[msg("Market is not open for joining")]
    MarketNotOpen,
    #[msg("Market has already started")]
    MarketAlreadyStarted,
    #[msg("Pool amount overflow")]
    PoolOverflow,
    #[msg("Participant count overflow")]
    ParticipantOverflow,
    #[msg("Prediction count overflow")]
    CountOverflow,
    #[msg("Only market creator can resolve")]
    UnauthorizedResolver,
    #[msg("Market is already resolved")]
    MarketAlreadyResolved,
    #[msg("Market has not ended yet")]
    MarketNotEnded,
    #[msg("Market is not resolved yet")]
    MarketNotResolved,
    #[msg("Rewards already withdrawn")]
    AlreadyWithdrawn,
    #[msg("No outcome set for market")]
    NoOutcome,
    #[msg("User is not a winner")]
    NotAWinner,
    #[msg("No winners in this market")]
    NoWinners,
    #[msg("Calculation error")]
    CalculationError,
    #[msg("Insufficient funds in market")]
    InsufficientFunds,
}