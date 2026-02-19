CREATE SCHEMA IF NOT EXISTS booking;

CREATE TABLE booking.booking (
                                 id UUID PRIMARY KEY,
                                 user_id UUID NOT NULL,
                                 show_id UUID NOT NULL,
                                 status VARCHAR(30) NOT NULL,
                                 total_amount NUMERIC(10,2),
                                 currency VARCHAR(10),
                                 created_at TIMESTAMP NOT NULL,
                                 updated_at TIMESTAMP NOT NULL
);

CREATE TABLE booking.seat_hold (
                                   id UUID PRIMARY KEY,
                                   show_id UUID NOT NULL,
                                   seat_id UUID NOT NULL,
                                   user_id UUID NOT NULL,
                                   expires_at TIMESTAMP NOT NULL,
                                   status VARCHAR(30) NOT NULL
);

CREATE TABLE booking.booking_seat (
                                      id UUID PRIMARY KEY,
                                      booking_id UUID NOT NULL REFERENCES booking.booking(id),
                                      seat_id UUID NOT NULL,
                                      status VARCHAR(30) NOT NULL
);

CREATE TABLE booking.seat (
                              id UUID PRIMARY KEY,
                              show_id UUID NOT NULL,
                              row_label VARCHAR(5),
                              number INT
);

CREATE INDEX idx_seat_hold_show ON booking.seat_hold(show_id);
CREATE INDEX idx_seat_hold_seat ON booking.seat_hold(seat_id);
CREATE INDEX idx_booking_user ON booking.booking(user_id);
CREATE INDEX idx_booking_show ON booking.booking(show_id);


CREATE UNIQUE INDEX unique_active_seat_hold
    ON booking.seat_hold(show_id, seat_id)
    WHERE status = 'ACTIVE';

INSERT INTO booking.seat (id, show_id, row_label, number) VALUES
                                                              ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'A', 1),
                                                              ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'A', 2),
                                                              ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'A', 3);
