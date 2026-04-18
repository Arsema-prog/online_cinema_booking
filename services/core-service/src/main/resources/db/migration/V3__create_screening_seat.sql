-- ============================================
-- Create screening_seat table
-- ============================================
CREATE TABLE core.screening_seat (
                                     id BIGSERIAL PRIMARY KEY,
                                     screening_id BIGINT NOT NULL REFERENCES core.screening(id) ON DELETE CASCADE,
                                     seat_id BIGINT NOT NULL REFERENCES core.seat(id) ON DELETE CASCADE,
                                     is_booked BOOLEAN DEFAULT FALSE,
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     UNIQUE (screening_id, seat_id)
);

-- ============================================
-- Populate screening_seat
-- ============================================
INSERT INTO core.screening_seat (screening_id, seat_id)
SELECT
    sc.id,
    st.id
FROM core.screening sc
         JOIN core.seat st
              ON st.screen_id = sc.screen_id;

-- ============================================
-- OPTIONAL: Simulate booked seats (for testing)
-- ============================================
UPDATE core.screening_seat
SET is_booked = TRUE
WHERE id IN (
    SELECT id FROM core.screening_seat
    ORDER BY random()
    LIMIT 20
    );