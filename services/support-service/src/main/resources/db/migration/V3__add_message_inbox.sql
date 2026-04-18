CREATE TABLE IF NOT EXISTS message_inbox (
    event_id VARCHAR(128) PRIMARY KEY,
    event_type VARCHAR(128) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT now()
);
