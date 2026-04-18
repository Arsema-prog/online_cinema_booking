-- Legacy V2 defined booking_id as VARCHAR; JPA maps it as Long (bigint).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.table_name = 'tickets'
          AND c.column_name = 'booking_id'
          AND c.data_type = 'character varying'
    ) THEN
        ALTER TABLE tickets
            ALTER COLUMN booking_id TYPE BIGINT USING booking_id::bigint;
    END IF;
END $$;
