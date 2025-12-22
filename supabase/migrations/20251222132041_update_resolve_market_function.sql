-- Drop and recreate the resolve_market function to work with atomic units
DROP FUNCTION IF EXISTS resolve_market(UUID, TEXT);

CREATE OR REPLACE FUNCTION resolve_market(
    market_id_param UUID,
    winning_outcome TEXT
)
RETURNS TABLE(
    participant_id UUID,
    user_id UUID,
    winnings BIGINT
) AS $$
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
$$ LANGUAGE plpgsql;