use anchor_lang::prelude::*;

declare_id!("5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEYnkCbqdaYmZ");

#[program]
pub mod cryptoscore_factory {
    use super::*;

    /// Initialize the factory with authority and platform fee
    pub fn initialize_factory(ctx: Context<InitializeFactory>, platform_fee_bps: u16) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        
        // Validate platform fee (max 10% = 1000 bps)
        require!(platform_fee_bps <= 1000, FactoryError::InvalidPlatformFee);
        
        factory.authority = ctx.accounts.authority.key();
        factory.market_count = 0;
        factory.platform_fee_bps = platform_fee_bps;
        factory.bump = ctx.bumps.factory;
        
        msg!("Factory initialized with authority: {}, platform fee: {} bps", 
            factory.authority, factory.platform_fee_bps);
        
        Ok(())
    }

    /// Create a new prediction market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        match_id: String,
        entry_fee: u64,
        kickoff_time: i64,
        end_time: i64,
        is_public: bool,
    ) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        let market_registry = &mut ctx.accounts.market_registry;
        
        // Validate match ID is not empty
        require!(!match_id.is_empty(), FactoryError::InvalidMatchId);
        require!(match_id.len() <= 64, FactoryError::MatchIdTooLong);
        
        // Validate entry fee is non-zero
        require!(entry_fee > 0, FactoryError::ZeroEntryFee);
        
        // Validate times
        let current_time = Clock::get()?.unix_timestamp;
        require!(kickoff_time > current_time, FactoryError::InvalidKickoffTime);
        require!(end_time > kickoff_time, FactoryError::InvalidEndTime);
        
        // Initialize market registry
        market_registry.factory = factory.key();
        market_registry.market_address = ctx.accounts.market_account.key();
        market_registry.creator = ctx.accounts.creator.key();
        market_registry.match_id = match_id.clone();
        market_registry.created_at = current_time;
        market_registry.is_public = is_public;
        market_registry.entry_fee = entry_fee;
        market_registry.kickoff_time = kickoff_time;
        market_registry.end_time = end_time;
        market_registry.bump = ctx.bumps.market_registry;
        
        // Increment market count
        factory.market_count = factory.market_count.checked_add(1)
            .ok_or(FactoryError::MarketCountOverflow)?;
        
        // Emit event
        emit!(MarketCreated {
            market: ctx.accounts.market_account.key(),
            creator: ctx.accounts.creator.key(),
            match_id,
            entry_fee,
            kickoff_time,
            is_public,
        });
        
        msg!("Market created: {}, creator: {}", 
            ctx.accounts.market_account.key(), ctx.accounts.creator.key());
        
        Ok(())
    }

    /// Get paginated list of markets with filtering
    pub fn get_markets(
        _ctx: Context<GetMarkets>,
        filter_creator: Option<Pubkey>,
        filter_public: Option<bool>,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<MarketInfo>> {
        // This is a view function that would be called off-chain
        // In practice, clients would fetch market registry accounts directly
        // This is here for documentation purposes
        
        msg!("Getting markets - page: {}, size: {}, creator: {:?}, public: {:?}", 
            page, page_size, filter_creator, filter_public);
        
        // Return empty vec as this is meant to be called off-chain
        Ok(vec![])
    }
}

// Account Structures

#[account]
pub struct Factory {
    /// Authority that can update factory settings
    pub authority: Pubkey,
    /// Total number of markets created
    pub market_count: u64,
    /// Platform fee in basis points (100 = 1%)
    pub platform_fee_bps: u16,
    /// PDA bump seed
    pub bump: u8,
}

impl Factory {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 +  // market_count
        2 +  // platform_fee_bps
        1;   // bump
}

#[account]
pub struct MarketRegistry {
    /// Factory that created this market
    pub factory: Pubkey,
    /// Market account address
    pub market_address: Pubkey,
    /// Creator of the market
    pub creator: Pubkey,
    /// Match identifier (e.g., "EPL-2024-123")
    pub match_id: String,
    /// Timestamp when market was created
    pub created_at: i64,
    /// Whether market is public or private
    pub is_public: bool,
    /// Entry fee in lamports
    pub entry_fee: u64,
    /// Match kickoff time
    pub kickoff_time: i64,
    /// Match end time
    pub end_time: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl MarketRegistry {
    pub const MAX_MATCH_ID_LEN: usize = 64;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // factory
        32 + // market_address
        32 + // creator
        4 + Self::MAX_MATCH_ID_LEN + // match_id (String with length prefix)
        8 +  // created_at
        1 +  // is_public
        8 +  // entry_fee
        8 +  // kickoff_time
        8 +  // end_time
        1;   // bump
}

// Context Structures

#[derive(Accounts)]
pub struct InitializeFactory<'info> {
    #[account(
        init,
        payer = authority,
        space = Factory::LEN,
        seeds = [b"factory"],
        bump
    )]
    pub factory: Account<'info, Factory>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct CreateMarket<'info> {
    #[account(
        mut,
        seeds = [b"factory"],
        bump = factory.bump
    )]
    pub factory: Account<'info, Factory>,
    
    #[account(
        init,
        payer = creator,
        space = MarketRegistry::LEN,
        seeds = [
            b"market_registry",
            factory.key().as_ref(),
            match_id.as_bytes()
        ],
        bump
    )]
    pub market_registry: Account<'info, MarketRegistry>,
    
    /// CHECK: This is the market account that will be initialized by the market program
    pub market_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetMarkets<'info> {
    #[account(
        seeds = [b"factory"],
        bump = factory.bump
    )]
    pub factory: Account<'info, Factory>,
}

// Events

#[event]
pub struct MarketCreated {
    #[index]
    pub market: Pubkey,
    #[index]
    pub creator: Pubkey,
    pub match_id: String,
    pub entry_fee: u64,
    pub kickoff_time: i64,
    pub is_public: bool,
}

// Return Types

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketInfo {
    pub market_address: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub created_at: i64,
    pub is_public: bool,
    pub entry_fee: u64,
}

// Error Codes

#[error_code]
pub enum FactoryError {
    #[msg("Platform fee cannot exceed 10% (1000 bps)")]
    InvalidPlatformFee,
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
    #[msg("Market count overflow")]
    MarketCountOverflow,
}
