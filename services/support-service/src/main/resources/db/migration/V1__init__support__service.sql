-- V1__init_support_service.sql
CREATE TABLE tickets (
                         id BIGSERIAL PRIMARY KEY,
                         booking_id BIGINT NOT NULL,
                         user_id BIGINT NOT NULL,
                         qr_code VARCHAR(255) NOT NULL,
                         pdf_url VARCHAR(500),
                         status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_audit (
                              id BIGSERIAL PRIMARY KEY,
                              ticket_id BIGINT NOT NULL REFERENCES tickets(id),
                              staff_id BIGINT NOT NULL,
                              scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_logs (
                            id BIGSERIAL PRIMARY KEY,
                            booking_id BIGINT NOT NULL,
                            email_type VARCHAR(50) NOT NULL,
                            status VARCHAR(20) NOT NULL,
                            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

