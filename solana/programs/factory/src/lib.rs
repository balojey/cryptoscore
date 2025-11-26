use anchor_lang::prelude::*;

declare_id!("93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP");

#[program]
pub mod cryptoscore_factory {
    use super::*;

    pub fn initialize_factory(ctx: Context<InitializeFactory>) -> Result<()> {
        msg!("Initializing CryptoScore Factory: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_market(ctx: Context<CreateMarket>) -> Result<()> {
        msg!("Creating new market");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeFactory {}

#[derive(Accounts)]
pub struct CreateMarket {}
