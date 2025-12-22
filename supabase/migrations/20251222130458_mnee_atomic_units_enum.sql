-- Update transaction_type enum to include creator_reward if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'transaction_type' AND e.enumlabel = 'creator_reward') THEN
        ALTER TYPE transaction_type ADD VALUE 'creator_reward';
    END IF;
END $$;