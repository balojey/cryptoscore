-- Create helper function for atomic to MNEE conversion
CREATE OR REPLACE FUNCTION atomic_to_mnee(atomic_amount BIGINT)
RETURNS DECIMAL(20,5) AS $$
BEGIN
    RETURN (atomic_amount::DECIMAL / 100000);
END;
$$ LANGUAGE plpgsql IMMUTABLE;