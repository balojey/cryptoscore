-- Update platform configuration for MNEE atomic units
INSERT INTO platform_config (key, value) VALUES
    ('mnee_atomic_units_per_token', '"100000"'),
    ('mnee_decimal_places', '"5"'),
    ('mnee_symbol', '"MNEE"')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();