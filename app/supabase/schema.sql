-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE market_status AS ENUM ('active', 'resolved', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('market_entry', 'winnings', 'platform_fee', 'creator_reward');

-- Users table (replaces user account data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL UNIQUE, -- EVM wallet from Crossmint
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Markets table (replaces Factory program functionality)
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    entry_fee DECIMAL(20, 8) NOT NULL CHECK (entry_fee >= 0),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status market_status DEFAULT 'active',
    resolution_outcome TEXT,
    total_pool DECIMAL(20, 8) DEFAULT 0 CHECK (total_pool >= 0),
    platform_fee_percentage DECIMAL(5, 4) DEFAULT 0.05 CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table (replaces Market program participant data)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction TEXT NOT NULL,
    entry_amount DECIMAL(20, 8) NOT NULL CHECK (entry_amount >= 0),
    potential_winnings DECIMAL(20, 8) NOT NULL CHECK (potential_winnings >= 0),
    actual_winnings DECIMAL(20, 8) CHECK (actual_winnings >= 0),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(market_id, user_id) -- One prediction per user per market
);

-- Transactions table (replaces blockchain transaction history)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform configuration table (replaces program configuration)
CREATE TABLE platform_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_markets_creator_id ON markets(creator_id);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_end_time ON markets(end_time);
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX idx_participants_market_id ON participants(market_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_joined_at ON participants(joined_at DESC);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_market_id ON transactions(market_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON platform_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true); -- Public read for now, will be restricted with auth

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true); -- Will be restricted with auth

-- Users can insert their own data
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (true); -- Will be restricted with auth

-- Markets policies
-- Anyone can read active markets
CREATE POLICY "Anyone can view markets" ON markets
    FOR SELECT USING (true);

-- Only authenticated users can create markets
CREATE POLICY "Authenticated users can create markets" ON markets
    FOR INSERT WITH CHECK (true); -- Will be restricted with auth

-- Only market creators can update their markets
CREATE POLICY "Market creators can update own markets" ON markets
    FOR UPDATE USING (true); -- Will be restricted with auth

-- Participants policies
-- Anyone can read participants (for market display)
CREATE POLICY "Anyone can view participants" ON participants
    FOR SELECT USING (true);

-- Only authenticated users can join markets
CREATE POLICY "Authenticated users can join markets" ON participants
    FOR INSERT WITH CHECK (true); -- Will be restricted with auth

-- Transactions policies
-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (true); -- Will be restricted with auth

-- Only system can insert transactions (through functions)
CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true); -- Will be restricted to service role

-- Platform config policies
-- Anyone can read platform config
CREATE POLICY "Anyone can view platform config" ON platform_config
    FOR SELECT USING (true);

-- Only admins can modify platform config
CREATE POLICY "Admins can modify platform config" ON platform_config
    FOR ALL USING (true); -- Will be restricted to admin role

-- Insert default platform configuration
INSERT INTO platform_config (key, value) VALUES
    ('default_platform_fee_percentage', '0.05'),
    ('max_platform_fee_percentage', '0.10'),
    ('min_market_duration_hours', '1'),
    ('max_market_duration_days', '365')
ON CONFLICT (key) DO NOTHING;

-- Create function to update market total_pool when participants join
CREATE OR REPLACE FUNCTION update_market_total_pool()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update market total_pool
CREATE TRIGGER update_market_pool_on_participant_change
    AFTER INSERT OR DELETE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_market_total_pool();

-- Create function to calculate and distribute winnings
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
    total_winnings_pool DECIMAL(20, 8);
    participant_record RECORD;
    calculated_winnings DECIMAL(20, 8);
BEGIN
    -- Get market details
    SELECT * INTO market_record FROM markets WHERE id = market_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found';
    END IF;
    
    IF market_record.status != 'active' THEN
        RAISE EXCEPTION 'Market is not active';
    END IF;
    
    -- Calculate total amount from winning predictions
    SELECT COALESCE(SUM(entry_amount), 0) INTO total_winning_amount
    FROM participants 
    WHERE market_id = market_id_param AND prediction = winning_outcome;
    
    -- If no winners, return early
    IF total_winning_amount = 0 THEN
        UPDATE markets 
        SET status = 'resolved', 
            resolution_outcome = winning_outcome,
            updated_at = NOW()
        WHERE id = market_id_param;
        RETURN;
    END IF;
    
    -- Calculate platform fee and winnings pool
    platform_fee := market_record.total_pool * market_record.platform_fee_percentage;
    total_winnings_pool := market_record.total_pool - platform_fee;
    
    -- Update market status
    UPDATE markets 
    SET status = 'resolved', 
        resolution_outcome = winning_outcome,
        updated_at = NOW()
    WHERE id = market_id_param;
    
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
        
        -- Insert transaction record
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
    
    -- Record platform fee transaction (assign to market creator for tracking)
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