-- Create trigger for mnee_balances updated_at
CREATE TRIGGER update_mnee_balances_updated_at
    BEFORE UPDATE ON mnee_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on mnee_balances table
ALTER TABLE mnee_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mnee_balances
CREATE POLICY "Users can view own MNEE balances" ON mnee_balances
    FOR SELECT USING (true);

CREATE POLICY "System can manage MNEE balances" ON mnee_balances
    FOR ALL USING (true);