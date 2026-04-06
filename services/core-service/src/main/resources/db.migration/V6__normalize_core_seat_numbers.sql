-- Normalize core.seat.seat_number to include row_label prefix when missing
UPDATE core.seat
SET seat_number = row_label || seat_number
WHERE row_label IS NOT NULL
  AND seat_number IS NOT NULL
  AND seat_number NOT LIKE row_label || '%';

-- Ensure screening_seat.status reflects is_booked for existing rows
UPDATE core.screening_seat
SET status = 'RESERVED'
WHERE is_booked = TRUE AND (status IS NULL OR status <> 'RESERVED');

UPDATE core.screening_seat
SET status = 'AVAILABLE'
WHERE is_booked = FALSE AND (status IS NULL OR status <> 'AVAILABLE');
