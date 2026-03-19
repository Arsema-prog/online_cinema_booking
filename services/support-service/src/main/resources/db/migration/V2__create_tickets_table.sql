-- V2__create_tickets_table.sql
CREATE TABLE IF NOT EXISTS tickets (
                                       id BIGSERIAL PRIMARY KEY,
                                       booking_id VARCHAR(255) NOT NULL,
    ticket_number VARCHAR(255) UNIQUE NOT NULL,
    qr_code TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE'
    );

-- Add index for better performance
CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);