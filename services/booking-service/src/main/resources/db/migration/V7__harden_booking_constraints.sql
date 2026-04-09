SET search_path TO booking;

ALTER TABLE booking
    DROP CONSTRAINT IF EXISTS chk_booking_status;

ALTER TABLE booking_seat
    DROP CONSTRAINT IF EXISTS chk_booking_seat_status;

ALTER TABLE seat_hold
    DROP CONSTRAINT IF EXISTS chk_seat_hold_status;

ALTER TABLE booking_seat
    DROP CONSTRAINT IF EXISTS unique_show_seat;

ALTER TABLE seat_hold
    DROP CONSTRAINT IF EXISTS unique_hold_show_seat;

ALTER TABLE booking
    ADD CONSTRAINT chk_booking_status
        CHECK (status IN (
            'CREATED',
            'SEATS_HELD',
            'SNACKS_SELECTED',
            'PAYMENT_INITIATED',
            'PAYMENT_PENDING',
            'CONFIRMED',
            'FAILED',
            'EXPIRED',
            'CANCELLED'
        ));

ALTER TABLE booking_seat
    ADD CONSTRAINT chk_booking_seat_status
        CHECK (status IN (
            'SEATS_HELD',
            'PAYMENT_INITIATED',
            'PAYMENT_PENDING',
            'CONFIRMED',
            'FAILED',
            'EXPIRED',
            'CANCELLED'
        ));

ALTER TABLE seat_hold
    ADD CONSTRAINT chk_seat_hold_status
        CHECK (status IN (
            'ACTIVE',
            'EXPIRED',
            'RELEASED',
            'CONVERTED'
        ));

DROP INDEX IF EXISTS unique_show_seat;
DROP INDEX IF EXISTS unique_hold_show_seat;

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_seat_active
    ON booking_seat(show_id, seat_id)
    WHERE status IN ('SEATS_HELD', 'PAYMENT_INITIATED', 'PAYMENT_PENDING', 'CONFIRMED');

CREATE UNIQUE INDEX IF NOT EXISTS uq_seat_hold_active
    ON seat_hold(show_id, seat_id)
    WHERE status = 'ACTIVE';
