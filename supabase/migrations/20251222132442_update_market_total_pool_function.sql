-- Update the update_market_total_pool function to work with atomic units
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