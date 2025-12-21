-- Enhanced Prediction System Migration
-- This migration implements the schema changes required for:
-- - Football-data API integration
-- - Multiple predictions per user
-- - Automated resolution system
-- - Enhanced transaction logging

-- Update market_status enum to include football-data API status values
ALTER TYPE market_status RENAME TO market_status_old;

CREATE TYPE market_status AS ENUM (
    'SCHEDULED',    -- Match is scheduled but not started
    'LIVE',         -- Match is currently in progress
    'IN_PLAY',      -- Alternative live status
    'PAUSED',       -- Match temporarily paused
    'FINISHED',     -- Match completed normally
    'POSTPONED',    -- Match postponed to later date
    'CANCELLED',    -- Match cancelled
    'SUSPENDED'     -- Match suspended indefinitely
);

-- Update markets table to use new enum and add match data columns
ALTER TABLE markets 
    ALTER COLUMN status DROP DEFAULT,
    ALTER COLUMN status TYPE market_status USING (
        CASE status::text
            WHEN 'active' THEN 'SCHEDULED'::market_status
            WHEN 'resolved' THEN 'FINISHED'::market_status
            WHEN 'cancelled' THEN 'CANCELLED'::market_status
            ELSE 'SCHEDULED'::market_status
        END
    ),
    ALTER COLUMN status SET DEFAULT 'SCHEDULED';

-- Add new columns to markets table for football-data API integration
ALTER TABLE markets 
    ADD COLUMN match_id INTEGER,
    ADD COLUMN home_team_id INTEGER,
    ADD COLUMN home_team_name TEXT,
    ADD COLUMN away_team_id INTEGER,
    ADD COLUMN away_team_name TEXT,
    ADD COLUMN creator_reward_percentage DECIMAL(5, 4) DEFAULT 0.02 CHECK (creator_reward_percentage >= 0 AND creator_reward_percentage <= 1);

-- Update platform_fee_percentage default to 0.03 (3%)
ALTER TABLE markets 
    ALTER COLUMN platform_fee_percentage SET DEFAULT 0.03;

-- Add unique constraint on match_id to ensure one market per match
ALTER TABLE markets 
    ADD CONSTRAINT unique_match_id UNIQUE (match_id);

-- Create index for match_id lookups
CREATE INDEX idx_markets_match_id ON markets(match_id);

-- Remove unique constraint from participants table to allow multiple predictions per user
ALTER TABLE participants 
    DROP CONSTRAINT participants_market_id_user_id_key;

-- Add new unique constraint to allow multiple predictions but prevent duplicate outcomes
ALTER TABLE participants 
    ADD CONSTRAINT unique_market_user_prediction UNIQUE (market_id, user_id, prediction);

-- Update transaction_type enum to include automated_transfer
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'automated_transfer';

-- Create indexes for new columns and improved performance
CREATE INDEX idx_markets_home_team_id ON markets(home_team_id);
CREATE INDEX idx_markets_away_team_id ON markets(away_team_id);
CREATE INDEX idx_participants_prediction ON participants(prediction);

-- Update the resolve_market function to handle multiple predictions and creator rewards
CREATE OR REPLACE FUNCTION resolve_market(
    market_id_param UUID,
    winning_outcome TEXT
)
RETURNS TABLE(
    participant_id UUID,
    user_id UUID,
    winnings DECIMAL(20, 8)
) AS $$
DECLARE
    market_record RECORD;
    total_winning_amount DECIMAL(20, 8);
    platform_fee DECIMAL(20, 8);
    creator_reward DECIMAL(20, 8);
    total_winnings_pool DECIMAL(20, 8);
    participant_record RECORD;
    calculated_winnings DECIMAL(20, 8);
BEGIN
    -- Get market details
    SELECT * INTO market_record FROM markets WHERE id = market_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found';
    END IF;
    
    IF market_record.status NOT IN ('SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED') THEN
        RAISE EXCEPTION 'Market is not in a resolvable state';
    END IF;
    
    -- Calculate total amount from winning predictions
    SELECT COALESCE(SUM(entry_amount), 0) INTO total_winning_amount
    FROM participants 
    WHERE market_id = market_id_param AND prediction = winning_outcome;
    
    -- Calculate platform fee and creator reward
    platform_fee := market_record.total_pool * market_record.platform_fee_percentage;
    creator_reward := market_record.total_pool * COALESCE(market_record.creator_reward_percentage, 0.02);
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
        -- Proportional winnings based on entry amount
        calculated_winnings := (participant_record.entry_amount / total_winning_amount) * total_winnings_pool;
        
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
$$ LANGUAGE plpgsql;

-- Drop the old enum type
DROP TYPE market_status_old;

-- Update platform configuration with new defaults
INSERT INTO platform_config (key, value) VALUES
    ('default_platform_fee_percentage', '0.03'),
    ('default_creator_reward_percentage', '0.02'),
    ('max_predictions_per_user_per_market', '3'),
    ('football_data_api_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Create function to validate prediction limits (max 3 per user per market)
CREATE OR REPLACE FUNCTION validate_prediction_limit()
RETURNS TRIGGER AS $$
DECLARE
    prediction_count INTEGER;
    max_predictions INTEGER := 3;
BEGIN
    -- Count existing predictions for this user in this market
    SELECT COUNT(*) INTO prediction_count
    FROM participants 
    WHERE market_id = NEW.market_id AND user_id = NEW.user_id;
    
    -- Check if adding this prediction would exceed the limit
    IF prediction_count >= max_predictions THEN
        RAISE EXCEPTION 'User cannot place more than % predictions per market', max_predictions;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce prediction limits
CREATE TRIGGER enforce_prediction_limit
    BEFORE INSERT ON participants
    FOR EACH ROW EXECUTE FUNCTION validate_prediction_limit();

-- Create function to get match data for a market
CREATE OR REPLACE FUNCTION get_market_match_data(market_id_param UUID)
RETURNS TABLE(
    match_id INTEGER,
    home_team_id INTEGER,
    home_team_name TEXT,
    away_team_id INTEGER,
    away_team_name TEXT,
    status market_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.match_id,
        m.home_team_id,
        m.home_team_name,
        m.away_team_id,
        m.away_team_name,
        m.status
    FROM markets m
    WHERE m.id = market_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to update market status from football-data API
CREATE OR REPLACE FUNCTION update_market_status_from_api(
    match_id_param INTEGER,
    new_status market_status
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE markets 
    SET status = new_status,
        updated_at = NOW()
    WHERE match_id = match_id_param
    AND status != new_status; -- Only update if status actually changed
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the schema changes
COMMENT ON COLUMN markets.match_id IS 'Football-Data API match identifier';
COMMENT ON COLUMN markets.home_team_id IS 'Football-Data API home team identifier';
COMMENT ON COLUMN markets.home_team_name IS 'Home team display name';
COMMENT ON COLUMN markets.away_team_id IS 'Football-Data API away team identifier';
COMMENT ON COLUMN markets.away_team_name IS 'Away team display name';
COMMENT ON COLUMN markets.creator_reward_percentage IS 'Percentage of total pool awarded to market creator';
COMMENT ON CONSTRAINT unique_market_user_prediction ON participants IS 'Allows multiple predictions per user but prevents duplicate outcomes';