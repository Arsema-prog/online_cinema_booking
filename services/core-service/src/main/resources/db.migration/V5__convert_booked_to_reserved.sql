-- Convert any legacy 'BOOKED' status values to 'RESERVED'
UPDATE core.screening_seat SET status = 'RESERVED' WHERE status = 'BOOKED';

-- Verify rows updated (optional):
-- SELECT status, count(*) FROM core.screening_seat GROUP BY status;
