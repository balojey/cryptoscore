-- Create indexes for mnee_balances table
CREATE INDEX IF NOT EXISTS idx_mnee_balances_user_id ON mnee_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_mnee_balances_address ON mnee_balances(address);
CREATE INDEX IF NOT EXISTS idx_mnee_balances_last_updated ON mnee_balances(last_updated);

-- Create indexes for MNEE-specific columns in transactions
CREATE INDEX IF NOT EXISTS idx_transactions_mnee_transaction_id ON transactions(mnee_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ticket_id ON transactions(ticket_id);