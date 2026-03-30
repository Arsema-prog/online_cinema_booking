-- Add automatic updated_at trigger for booking table
SET search_path TO booking;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking table
DROP TRIGGER IF EXISTS trigger_update_booking_updated_at ON booking;
CREATE TRIGGER trigger_update_booking_updated_at
    BEFORE UPDATE ON booking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();