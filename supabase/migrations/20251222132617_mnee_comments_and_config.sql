-- Add comments to document the MNEE atomic units schema
DO $$
BEGIN
    EXECUTE 'COMMENT ON COLUMN markets.entry_fee IS ''Market entry fee in MNEE atomic units (1 MNEE = 100,000 atomic units)''';
    EXECUTE 'COMMENT ON COLUMN markets.total_pool IS ''Total market pool in MNEE atomic units''';
    EXECUTE 'COMMENT ON COLUMN participants.entry_amount IS ''Participant entry amount in MNEE atomic units''';
    EXECUTE 'COMMENT ON COLUMN participants.potential_winnings IS ''Potential winnings in MNEE atomic units''';
    EXECUTE 'COMMENT ON COLUMN participants.actual_winnings IS ''Actual winnings in MNEE atomic units''';
    EXECUTE 'COMMENT ON COLUMN transactions.amount IS ''Transaction amount in MNEE atomic units''';
    EXECUTE 'COMMENT ON COLUMN transactions.mnee_transaction_id IS ''MNEE blockchain transaction identifier''';
    EXECUTE 'COMMENT ON COLUMN transactions.ticket_id IS ''MNEE SDK ticket identifier for transaction tracking''';
    EXECUTE 'COMMENT ON TABLE mnee_balances IS ''Cache table for user MNEE token balances''';
    EXECUTE 'COMMENT ON COLUMN mnee_balances.balance_atomic IS ''User balance in MNEE atomic units''';
    EXECUTE 'COMMENT ON COLUMN mnee_balances.balance_decimal IS ''User balance in MNEE tokens (for display)''';
    EXECUTE 'COMMENT ON COLUMN mnee_balances.address IS ''User EVM wallet address for MNEE operations''';
END $$;