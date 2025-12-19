use anchor_lang::prelude::*;

declare_id!("DHJASkp8vNuyR5xPSyj1G66xExRjnPBUuUN4QKiTnadZ");

#[program]
pub mod cryptoscore_dashboard {
    use super::*;

    /// Initialize or update user statistics
    pub fn update_user_stats(
        ctx: Context<UpdateUserStats>,
        market_result: MarketResult,
        amount_wagered: u64,
        amount_won: u64,
    ) -> Result<()> {
        let user_stats = &mut ctx.accounts.user_stats;
        let current_time = Clock::get()?.unix_timestamp;
        
        // Initialize if first time
        if user_stats.total_markets == 0 {
            user_stats.user = ctx.accounts.user.key();
            user_stats.bump = ctx.bumps.user_stats;
        }
        
        // Update totals
        user_stats.total_markets = user_stats.total_markets.checked_add(1)
            .ok_or(DashboardError::StatOverflow)?;
        
        user_stats.total_wagered = user_stats.total_wagered.checked_add(amount_wagered)
            .ok_or(DashboardError::StatOverflow)?;
        
        // Update wins/losses and streaks
        match market_result {
            MarketResult::Win => {
                user_stats.wins = user_stats.wins.checked_add(1)
                    .ok_or(DashboardError::StatOverflow)?;
                
                user_stats.total_won = user_stats.total_won.checked_add(amount_won)
                    .ok_or(DashboardError::StatOverflow)?;
                
                // Update streak
                if user_stats.current_streak >= 0 {
                    user_stats.current_streak = user_stats.current_streak.checked_add(1)
                        .ok_or(DashboardError::StatOverflow)?;
                } else {
                    user_stats.current_streak = 1;
                }
                
                // Update best streak
                if user_stats.current_streak > user_stats.best_streak as i32 {
                    user_stats.best_streak = user_stats.current_streak as u32;
                }
            },
            MarketResult::Loss => {
                user_stats.losses = user_stats.losses.checked_add(1)
                    .ok_or(DashboardError::StatOverflow)?;
                
                // Update streak
                if user_stats.current_streak <= 0 {
                    user_stats.current_streak = user_stats.current_streak.checked_sub(1)
                        .ok_or(DashboardError::StatOverflow)?;
                } else {
                    user_stats.current_streak = -1;
                }
            },
        }
        
        user_stats.last_updated = current_time;
        
        msg!("Updated stats for user {}: {} wins, {} losses, streak: {}", 
            ctx.accounts.user.key(), user_stats.wins, user_stats.losses, user_stats.current_streak);
        
        Ok(())
    }

    /// Get paginated list of all markets with filtering
    pub fn get_all_markets(
        _ctx: Context<GetAllMarkets>,
        filter_status: Option<u8>,
        filter_visibility: Option<bool>,
        sort_by: SortOption,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<MarketSummary>> {
        // This is a view function meant to be called off-chain
        // Clients should fetch market registry and market accounts directly
        // and apply filtering/sorting client-side
        
        msg!("Getting all markets - status: {:?}, visibility: {:?}, sort: {:?}, page: {}, size: {}", 
            filter_status, filter_visibility, sort_by, page, page_size);
        
        // Return empty vec as this is meant to be called off-chain
        Ok(vec![])
    }

    /// Get markets for a specific user with filtering
    pub fn get_user_markets(
        _ctx: Context<GetUserMarkets>,
        user: Pubkey,
        filter_status: Option<u8>,
        sort_by: SortOption,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<MarketSummary>> {
        // This is a view function meant to be called off-chain
        // Clients should fetch participant accounts for the user
        // then fetch corresponding market data
        
        msg!("Getting markets for user {} - status: {:?}, sort: {:?}, page: {}, size: {}", 
            user, filter_status, sort_by, page, page_size);
        
        // Return empty vec as this is meant to be called off-chain
        Ok(vec![])
    }

    /// Get comprehensive details for a specific market
    pub fn get_market_details(
        _ctx: Context<GetMarketDetails>,
        market: Pubkey,
    ) -> Result<MarketDetails> {
        // This is a view function meant to be called off-chain
        // Clients should fetch the market account and calculate derived metrics
        
        msg!("Getting details for market {}", market);
        
        // Return default as this is meant to be called off-chain
        Ok(MarketDetails::default())
    }

    /// Get aggregated statistics across all markets
    pub fn get_market_stats(
        _ctx: Context<GetMarketStats>,
    ) -> Result<AggregatedStats> {
        // This is a view function meant to be called off-chain
        // Clients should aggregate data from all market accounts
        
        msg!("Getting aggregated market statistics");
        
        // Return default as this is meant to be called off-chain
        Ok(AggregatedStats::default())
    }
}

// Account Structures

#[account]
pub struct UserStats {
    /// User's wallet address
    pub user: Pubkey,
    /// Total number of markets participated in
    pub total_markets: u32,
    /// Number of wins
    pub wins: u32,
    /// Number of losses
    pub losses: u32,
    /// Total amount wagered in lamports
    pub total_wagered: u64,
    /// Total amount won in lamports
    pub total_won: u64,
    /// Current winning/losing streak (positive = wins, negative = losses)
    pub current_streak: i32,
    /// Best winning streak
    pub best_streak: u32,
    /// Last update timestamp
    pub last_updated: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl UserStats {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        4 +  // total_markets
        4 +  // wins
        4 +  // losses
        8 +  // total_wagered
        8 +  // total_won
        4 +  // current_streak
        4 +  // best_streak
        8 +  // last_updated
        1;   // bump
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketResult {
    Win,
    Loss,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum SortOption {
    CreationTime,
    PoolSize,
    ParticipantCount,
    EndingSoon,
}

// Return Types

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MarketSummary {
    pub market_address: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub entry_fee: u64,
    pub kickoff_time: i64,
    pub end_time: i64,
    pub status: u8,
    pub total_pool: u64,
    pub participant_count: u32,
    pub home_count: u32,
    pub draw_count: u32,
    pub away_count: u32,
    pub is_public: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MarketDetails {
    pub market_address: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub entry_fee: u64,
    pub kickoff_time: i64,
    pub end_time: i64,
    pub status: u8,
    pub outcome: Option<u8>,
    pub total_pool: u64,
    pub participant_count: u32,
    pub home_count: u32,
    pub draw_count: u32,
    pub away_count: u32,
    pub is_public: bool,
    // Derived metrics
    pub home_percentage: u8,
    pub draw_percentage: u8,
    pub away_percentage: u8,
    pub prize_pool_after_fees: u64,
    pub reward_per_winner: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct AggregatedStats {
    pub total_markets: u32,
    pub open_markets: u32,
    pub live_markets: u32,
    pub resolved_markets: u32,
    pub total_participants: u32,
    pub total_volume: u64,
}

// Context Structures

#[derive(Accounts)]
pub struct UpdateUserStats<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = UserStats::LEN,
        seeds = [
            b"user_stats",
            user.key().as_ref()
        ],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetAllMarkets {}

#[derive(Accounts)]
pub struct GetUserMarkets {}

#[derive(Accounts)]
pub struct GetMarketDetails {}

#[derive(Accounts)]
pub struct GetMarketStats {}

// Error Codes

#[error_code]
pub enum DashboardError {
    #[msg("Statistics overflow")]
    StatOverflow,
    #[msg("Invalid page size")]
    InvalidPageSize,
    #[msg("Invalid sort option")]
    InvalidSortOption,
}