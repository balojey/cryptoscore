-- MNEE Atomic Units Migration
-- This migration updates the database schema to support MNEE tokens with atomic units
-- 1 MNEE = 100,000 atomic units for precision

-- Update transaction_type enum to include creator_reward if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'transaction_type' AND e.enumlabel = 'creator_reward') THEN
        ALTER TYPE transaction_type ADD VALUE 'creator_reward';
    END IF;
END $$;

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
    ALTER COLUMN amount TYPE BIGINT USING (amount * 100000)::BIGINT,
    ADD COLUMN mnee_transaction_id TEXT,
    ADD COLUMN ticket_id TEXT;

-- Create indexes for MNEE-specific columns
CREATE INDEX IF NOT EXISTS idx_transactions_mnee_transaction_id ON transactions(mnee_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ticket_id ON transactions(ticket_id);

-- Create mnee_balances table for caching user balances
CREATE TABLE IF NOT EXISTS mnee_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    balance_atomic BIGINT NOT NULL DEFAULT 0 CHECK (balance_atomic >= 0),
    balance_decimal DECIMAL(20,5) NOT NULL DEFAULT 0 CHECK (balance_decimal >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_address UNIQUE(user_id, address)
);

-- Create indexes for mnee_balances table
CREATE INDEX IF NOT EXISTS idx_mnee_balances_user_id ON mnee_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_mnee_balances_address ON mnee_balances(address);
CREATE INDEX IF NOT EXISTS idx_mnee_balances_last_updated ON mnee_balances(last_updated);

-- Create trigger for mnee_balances updated_at
CREATE TRIGGER update_mnee_balances_updated_at
    BEFORE UPDATE ON mnee_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on mnee_balances table
ALTER TABLE mnee_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mnee_balances
CREATE POLICY "Users can view own MNEE balances" ON mnee_balances
    FOR SELECT USING (true); -- Will be restricted with auth

CREATE POLICY "System can manage MNEE balances" ON mnee_balances
    FOR ALL USING (true); -- Will be restricted to service role

-- Update the resolve_market function to work with atomic units
CREATE OR REPLACE FUNCTION resolve_market(
    market_id_param UUID,
    winning_outcome TEXT
)
RETURNS TABLE(
    participant_id UUID,
    user_id UUID,
    winnings BIGINT
) AS $
DECLARE
    market_record RECORD;
    total_winning_amount BIGINT;
    platform_fee BIGINT;
    creator_reward BIGINT;
    total_winnings_pool BIGINT;
    participant_record RECORD;
    calculated_winnings BIGINT;
BEGIN
    -- Get market details
    SELECT * INTO market_record FROM markets WHERE id = market_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found';
    END IF;
    
    IF market_record.status NOT IN ('SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED') THEN
        RAISE EXCEPTION 'Market is not in a resolvable state';
    END IF;
    
    -- Calculate total amount from winning predictions (in atomic units)
    SELECT COALESCE(SUM(entry_amount), 0) INTO total_winning_amount
    FROM participants 
    WHERE market_id = market_id_param AND prediction = winning_outcome;
    
    -- Calculate platform fee and creator reward (in atomic units)
    platform_fee := (market_record.total_pool * market_record.platform_fee_percentage)::BIGINT;
    creator_reward := (market_record.total_pool * COALESCE(market_record.creator_reward_percentage, 0.02))::BIGINT;
    total_winnings_pool := market_record.total_pool - platform_fee - creator_reward;
    
    -- Update market status to FINISHED
    UPDATE markets 
    SET status = 'FINISHED', 
        resolution_outcome = winning_outcome,
        updated_at = NOW()
    WHERE id = market_id_param;
    
    -- If no winners, creator still gets reward but no winnings to distribute
    IF total_winning_amount = 0 THEN
        -- Record creator reward transaction
        IF creator_reward > 0 THEN
            INSERT INTO transactions (user_id, market_id, type, amount, description)
            VALUES (
                market_record.creator_id,
                market_id_param,
                'creator_reward',
                creator_reward,
                'Creator reward for market: ' || market_record.title
            );
        END IF;
        
        -- Record platform fee transaction
        IF platform_fee > 0 THEN
            INSERT INTO transactions (user_id, market_id, type, amount, description)
            VALUES (
                market_record.creator_id,
                market_id_param,
                'platform_fee',
                platform_fee,
                'Platform fee for market: ' || market_record.title
            );
        END IF;
        
        RETURN;
    END IF;
    
    -- Calculate and update winnings for each winning participant
    FOR participant_record IN 
        SELECT * FROM participants 
        WHERE market_id = market_id_param AND prediction = winning_outcome
    LOOP
        -- Proportional winnings based on entry amount (in atomic units)
        calculated_winnings := (participant_record.entry_amount * total_winnings_pool / total_winning_amount)::BIGINT;
        
        -- Update participant winnings
        UPDATE participants 
        SET actual_winnings = calculated_winnings
        WHERE id = participant_record.id;
        
        -- Insert winnings transaction record
        INSERT INTO transactions (user_id, market_id, type, amount, description)
        VALUES (
            participant_record.user_id,
            market_id_param,
            'winnings',
            calculated_winnings,
            'Market winnings for: ' || market_record.title
        );
        
        -- Return result
        participant_id := participant_record.id;
        user_id := participant_record.user_id;
        winnings := calculated_winnings;
        RETURN NEXT;
    END LOOP;
    
    -- Record creator reward transaction
    IF creator_reward > 0 THEN
        INSERT INTO transactions (user_id, market_id, type, amount, description)
        VALUES (
            market_record.creator_id,
            market_id_param,
            'creator_reward',
            creator_reward,
            'Creator reward for market: ' || market_record.title
        );
    END IF;
    
    -- Record platform fee transaction
    IF platform_fee > 0 THEN
        INSERT INTO transactions (user_id, market_id, type, amount, description)
        VALUES (
            market_record.creator_id,
            market_id_param,
            'platform_fee',
            platform_fee,
            'Platform fee for market: ' || market_record.title
        );
    END IF;
    
    RETURN;
END;
$ LANGUAGE plpgsql;

-- Update the update_market_total_pool function to work with atomic units
CREATE OR REPLACE FUNCTION update_market_total_pool()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE markets 
        SET total_pool = total_pool + NEW.entry_amount,
            updated_at = NOW()
        WHERE id = NEW.market_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE markets 
        SET total_pool = total_pool - OLD.entry_amount,
            updated_at = NOW()
        WHERE id = OLD.market_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Create helper functions for unit conversion
CREATE OR REPLACE FUNCTION atomic_to_mnee(atomic_amount BIGINT)
RETURNS DECIMAL(20,5) AS $
BEGIN
    RETURN (atomic_amount::DECIMAL / 100000);
END;
$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION mnee_to_atomic(mnee_amount DECIMAL)
RETURNS BIGINT AS $
BEGIN
    RETURN (mnee_amount * 100000)::BIGINT;
END;
$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update MNEE balance cache
CREATE OR REPLACE FUNCTION update_mnee_balance_cache(
    user_id_param UUID,
    address_param TEXT,
    balance_atomic_param BIGINT
)
RETURNS VOID AS $
BEGIN
    INSERT INTO mnee_balances (user_id, address, balance_atomic, balance_decimal, last_updated)
    VALUES (
        user_id_param,
        address_param,
        balance_atomic_param,
        atomic_to_mnee(balance_atomic_param),
        NOW()
    )
    ON CONFLICT (user_id, address)
    DO UPDATE SET
        balance_atomic = EXCLUDED.balance_atomic,
        balance_decimal = EXCLUDED.balance_decimal,
        last_updated = EXCLUDED.last_updated;
END;
$ LANGUAGE plpgsql;

-- Create function to get MNEE balance from cache
CREATE OR REPLACE FUNCTION get_mnee_balance_cache(
    user_id_param UUID,
    address_param TEXT
)
RETURNS TABLE(
    balance_atomic BIGINT,
    balance_decimal DECIMAL(20,5),
    last_updated TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        mb.balance_atomic,
        mb.balance_decimal,
        mb.last_updated
    FROM mnee_balances mb
    WHERE mb.user_id = user_id_param AND mb.address = address_param;
END;
$ LANGUAGE plpgsql;

-- Add comments to document the MNEE atomic units schema
COMMENT ON COLUMN markets.entry_fee IS 'Market entry fee in MNEE atomic units (1 MNEE = 100,000 atomic units)';
COMMENT ON COLUMN markets.total_pool IS 'Total market pool in MNEE atomic units';
COMMENT ON COLUMN participants.entry_amount IS 'Participant entry amount in MNEE atomic units';
COMMENT ON COLUMN participants.potential_winnings IS 'Potential winnings in MNEE atomic units';
COMMENT ON COLUMN participants.actual_winnings IS 'Actual winnings in MNEE atomic units';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in MNEE atomic units';
COMMENT ON COLUMN transactions.mnee_transaction_id IS 'MNEE blockchain transaction identifier';
COMMENT ON COLUMN transactions.ticket_id IS 'MNEE SDK ticket identifier for transaction tracking';
COMMENT ON TABLE mnee_balances IS 'Cache table for user MNEE token balances';
COMMENT ON COLUMN mnee_balances.balance_atomic IS 'User balance in MNEE atomic units';
COMMENT ON COLUMN mnee_balances.balance_decimal IS 'User balance in MNEE tokens (for display)';
COMMENT ON COLUMN mnee_balances.address IS 'User EVM wallet address for MNEE operations';

-- Update platform configuration for MNEE atomic units
INSERT INTO platform_config (key, value) VALUES
    ('mnee_atomic_units_per_token', '100000'),
    ('mnee_decimal_places', '5'),
    ('mnee_symbol', 'MNEE')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();