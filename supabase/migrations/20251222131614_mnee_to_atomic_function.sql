-- Create helper function for MNEE to atomic conversion
CREATE OR REPLACE FUNCTION mnee_to_atomic(mnee_amount DECIMAL)
RETURNS BIGINT AS $$
BEGIN
    RETURN (mnee_amount * 100000)::BIGINT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;