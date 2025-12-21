-- Enhanced Transaction Logging Migration
-- Adds status tracking, metadata, and updated_at fields to transactions table

-- Add new columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on status for efficient querying
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Create index on metadata for JSON queries
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING GIN(metadata);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions(updated_at);

-- Update existing transactions to have COMPLETED status
UPDATE transactions 
SET status = 'COMPLETED', updated_at = created_at 
WHERE status IS NULL;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on transaction updates
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to document the enhanced transaction logging
COMMENT ON COLUMN transactions.status IS 'Transaction status: PENDING, COMPLETED, or FAILED';
COMMENT ON COLUMN transactions.metadata IS 'JSON metadata containing detailed transaction information';
COMMENT ON COLUMN transactions.updated_at IS 'Timestamp when transaction was last updated';