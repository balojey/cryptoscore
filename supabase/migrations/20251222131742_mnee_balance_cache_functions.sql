-- Create function to update MNEE balance cache
CREATE OR REPLACE FUNCTION update_mnee_balance_cache(
    user_id_param UUID,
    address_param TEXT,
    balance_atomic_param BIGINT
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;