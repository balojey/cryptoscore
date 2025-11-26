use anchor_lang::prelude::*;

declare_id!("95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR");

#[program]
pub mod cryptoscore_dashboard {
    use super::*;

    pub fn get_all_markets(ctx: Context<GetAllMarkets>) -> Result<()> {
        msg!("Getting all markets");
        Ok(())
    }

    pub fn get_user_markets(ctx: Context<GetUserMarkets>) -> Result<()> {
        msg!("Getting user markets");
        Ok(())
    }

    pub fn get_market_details(ctx: Context<GetMarketDetails>) -> Result<()> {
        msg!("Getting market details");
        Ok(())
    }

    pub fn get_market_stats(ctx: Context<GetMarketStats>) -> Result<()> {
        msg!("Getting market stats");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct GetAllMarkets {}

#[derive(Accounts)]
pub struct GetUserMarkets {}

#[derive(Accounts)]
pub struct GetMarketDetails {}

#[derive(Accounts)]
pub struct GetMarketStats {}