-- V2__create_tickets_table.sql
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(255) UNIQUE NOT NULL,
    booking_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    screen_name VARCHAR(255) NOT NULL,
    show_time TIMESTAMP NOT NULL,
    seat_number VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    qr_code VARCHAR(255),
    pdf_object_key VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    validated_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    validation_token VARCHAR(80) UNIQUE NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);