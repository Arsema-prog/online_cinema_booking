package com.cinema.booking_service.repository;

import com.cinema.booking_service.domain.MessageInbox;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageInboxRepository extends JpaRepository<MessageInbox, String> {
}

