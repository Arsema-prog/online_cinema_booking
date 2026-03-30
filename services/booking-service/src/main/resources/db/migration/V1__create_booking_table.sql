-- Create the booking schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS booking;

-- Set search path for this migration
SET search_path TO booking;

-- =====================================================
-- Table: booking
-- =====================================================
CREATE TABLE IF NOT EXISTS booking (
                                       id UUID PRIMARY KEY,
                                       user_id UUID NOT NULL,
                                       show_id UUID NOT NULL,
                                       status VARCHAR(50) NOT NULL,
    movie_title VARCHAR(255),
    branch_name VARCHAR(255),
    screen_name VARCHAR(255),
    show_time TIMESTAMP,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
    );

COMMENT ON TABLE booking IS 'Main bookings table';
COMMENT ON COLUMN booking.id IS 'Unique identifier for the booking';
COMMENT ON COLUMN booking.user_id IS 'ID of the user who made the booking';
COMMENT ON COLUMN booking.show_id IS 'ID of the show being booked';
COMMENT ON COLUMN booking.status IS 'Booking status: PENDING, CONFIRMED, CANCELLED, COMPLETED';
COMMENT ON COLUMN booking.total_amount IS 'Total amount paid for the booking';

-- =====================================================
-- Table: seat
-- =====================================================
CREATE TABLE IF NOT EXISTS seat (
                                    id UUID PRIMARY KEY,
                                    show_id UUID NOT NULL,
                                    row_label VARCHAR(10),
    number INTEGER
    );

COMMENT ON TABLE seat IS 'Seats configuration for shows';
COMMENT ON COLUMN seat.id IS 'Unique identifier for the seat';
COMMENT ON COLUMN seat.show_id IS 'ID of the show this seat belongs to';
COMMENT ON COLUMN seat.row_label IS 'Row label (e.g., A, B, C)';
COMMENT ON COLUMN seat.number IS 'Seat number within the row';

-- =====================================================
-- Table: booking_seat
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_seat (
                                            id UUID PRIMARY KEY,
                                            booking_id UUID NOT NULL,
                                            show_id UUID NOT NULL,
                                            seat_id UUID NOT NULL,
                                            status VARCHAR(50) NOT NULL,
    CONSTRAINT unique_show_seat UNIQUE (show_id, seat_id)
    );

COMMENT ON TABLE booking_seat IS 'Links bookings to specific seats';
COMMENT ON COLUMN booking_seat.id IS 'Unique identifier for the booking-seat relationship';
COMMENT ON COLUMN booking_seat.booking_id IS 'ID of the booking';
COMMENT ON COLUMN booking_seat.show_id IS 'ID of the show';
COMMENT ON COLUMN booking_seat.seat_id IS 'ID of the seat';
COMMENT ON COLUMN booking_seat.status IS 'Status: CONFIRMED, CANCELLED';

-- =====================================================
-- Table: seat_hold
-- =====================================================
CREATE TABLE IF NOT EXISTS seat_hold (
                                         id UUID PRIMARY KEY,
                                         booking_id UUID NOT NULL,
                                         show_id UUID NOT NULL,
                                         seat_id UUID NOT NULL,
                                         user_id UUID NOT NULL,
                                         expires_at TIMESTAMP NOT NULL,
                                         status VARCHAR(50) NOT NULL,
    CONSTRAINT unique_hold_show_seat UNIQUE (show_id, seat_id)
    );

COMMENT ON TABLE seat_hold IS 'Temporary holds on seats during checkout';
COMMENT ON COLUMN seat_hold.id IS 'Unique identifier for the seat hold';
COMMENT ON COLUMN seat_hold.booking_id IS 'ID of the booking this hold is for';
COMMENT ON COLUMN seat_hold.show_id IS 'ID of the show';
COMMENT ON COLUMN seat_hold.seat_id IS 'ID of the held seat';
COMMENT ON COLUMN seat_hold.user_id IS 'ID of the user holding the seat';
COMMENT ON COLUMN seat_hold.expires_at IS 'Timestamp when the hold expires';
COMMENT ON COLUMN seat_hold.status IS 'Status: HELD, EXPIRED';

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Booking table indexes
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_show_id ON booking(show_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);
CREATE INDEX IF NOT EXISTS idx_booking_created_at ON booking(created_at);

-- Seat table indexes
CREATE INDEX IF NOT EXISTS idx_seat_show_id ON seat(show_id);
CREATE INDEX IF NOT EXISTS idx_seat_row_number ON seat(row_label, number);

-- Booking seat indexes
CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id ON booking_seat(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seat_seat_id ON booking_seat(seat_id);
CREATE INDEX IF NOT EXISTS idx_booking_seat_show_id ON booking_seat(show_id);
CREATE INDEX IF NOT EXISTS idx_booking_seat_status ON booking_seat(status);

-- Seat hold indexes
CREATE INDEX IF NOT EXISTS idx_seat_hold_booking_id ON seat_hold(booking_id);
CREATE INDEX IF NOT EXISTS idx_seat_hold_seat_id ON seat_hold(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_hold_user_id ON seat_hold(user_id);
CREATE INDEX IF NOT EXISTS idx_seat_hold_expires_at ON seat_hold(expires_at);
CREATE INDEX IF NOT EXISTS idx_seat_hold_status ON seat_hold(status);

-- Composite index for checking available seats
CREATE INDEX IF NOT EXISTS idx_booking_seat_show_seat_status ON booking_seat(show_id, seat_id, status);
CREATE INDEX IF NOT EXISTS idx_seat_hold_show_seat_status ON seat_hold(show_id, seat_id, status);