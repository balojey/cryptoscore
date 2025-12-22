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