CREATE TABLE IF NOT EXISTS message_inbox (
    event_id        VARCHAR(64) PRIMARY KEY,
    event_type      VARCHAR(64) NOT NULL,
    received_at     TIMESTAMP   NOT NULL DEFAULT now(),
    processed_at    TIMESTAMP   NULL
);

CREATE INDEX IF NOT EXISTS idx_message_inbox_event_type ON message_inbox(event_type);
