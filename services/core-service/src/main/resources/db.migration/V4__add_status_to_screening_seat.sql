-- Add status column to screening_seat to persist seat state
ALTER TABLE core.screening_seat
    ADD COLUMN IF NOT EXISTS status VARCHAR(32);

-- Initialize existing rows to AVAILABLE where status is NULL
UPDATE core.screening_seat SET status = 'AVAILABLE' WHERE status IS NULL;

-- Optional: add comment
COMMENT ON COLUMN core.screening_seat.status IS 'Current status of the seat: AVAILABLE, HELD, RESERVED, CANCELLED';
