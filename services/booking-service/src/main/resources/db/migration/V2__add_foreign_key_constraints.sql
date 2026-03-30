-- Add foreign key constraints (separate migration to ensure tables exist first)
SET search_path TO booking;

-- BookingSeat foreign keys
ALTER TABLE booking_seat
    ADD CONSTRAINT fk_booking_seat_booking
        FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE;

ALTER TABLE booking_seat
    ADD CONSTRAINT fk_booking_seat_seat
        FOREIGN KEY (seat_id) REFERENCES seat(id) ON DELETE CASCADE;

-- SeatHold foreign keys
ALTER TABLE seat_hold
    ADD CONSTRAINT fk_seat_hold_booking
        FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE;

ALTER TABLE seat_hold
    ADD CONSTRAINT fk_seat_hold_seat
        FOREIGN KEY (seat_id) REFERENCES seat(id) ON DELETE CASCADE;