-- Create enum types for better data integrity (optional, can also use CHECK constraints)
SET search_path TO booking;

-- Create enum types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_hold_status') THEN
CREATE TYPE seat_hold_status AS ENUM ('HELD', 'EXPIRED');
END IF;
END $$;

-- Add check constraints to ensure valid values (alternative to enums)
ALTER TABLE booking
    ADD CONSTRAINT chk_booking_status
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'));

ALTER TABLE booking_seat
    ADD CONSTRAINT chk_booking_seat_status
        CHECK (status IN ('CONFIRMED', 'CANCELLED'));

ALTER TABLE seat_hold
    ADD CONSTRAINT chk_seat_hold_status
        CHECK (status IN ('HELD', 'EXPIRED'));