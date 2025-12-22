-- Create function to get MNEE balance from cache
CREATE OR REPLACE FUNCTION get_mnee_balance_cache(
    user_id_param UUID,
    address_param TEXT
)
RETURNS TABLE(
    balance_atomic BIGINT,
    balance_decimal DECIMAL(20,5),
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mb.balance_atomic,
        mb.balance_decimal,
        mb.last_updated
    FROM mnee_balances mb
    WHERE mb.user_id = user_id_param AND mb.address = address_param;
END;
$$ LANGUAGE plpgsql;