-- Update markets table to use BIGINT for atomic units
ALTER TABLE markets 
    ALTER COLUMN entry_fee TYPE BIGINT USING (entry_fee * 100000)::BIGINT,
    ALTER COLUMN total_pool TYPE BIGINT USING (total_pool * 100000)::BIGINT;

-- Update participants table to use BIGINT for atomic units
ALTER TABLE participants 
    ALTER COLUMN entry_amount TYPE BIGINT USING (entry_amount * 100000)::BIGINT,
    ALTER COLUMN potential_winnings TYPE BIGINT USING (potential_winnings * 100000)::BIGINT,
    ALTER COLUMN actual_winnings TYPE BIGINT USING (COALESCE(actual_winnings, 0) * 100000)::BIGINT;

-- Update transactions table to use BIGINT for atomic units and add MNEE-specific columns
ALTER TABLE transactions 
    ALTER COLUMN amount TYPE BIGINT USING (amount * 100000)::BIGINT;

-- Add MNEE-specific columns to transactions table
ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS mnee_transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS ticket_id TEXT;