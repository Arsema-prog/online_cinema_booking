SET search_path TO booking;

ALTER TABLE booking
    ADD COLUMN IF NOT EXISTS snacks_total DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE booking
    ADD COLUMN IF NOT EXISTS snack_details VARCHAR(1000);
