-- Add seat_label column to booking.booking_seat and populate from booking.seat
ALTER TABLE booking.booking_seat
    ADD COLUMN IF NOT EXISTS seat_label VARCHAR(255);

-- Populate seat_label from booking.seat if available (only for nulls)
UPDATE booking.booking_seat bs
SET seat_label = COALESCE(
    (SELECT s.row_label || s.number::text FROM booking.seat s WHERE s.id = bs.seat_id),
    'UNKNOWN'
)
WHERE bs.seat_label IS NULL;
