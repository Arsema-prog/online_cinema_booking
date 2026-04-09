package com.cinema.supportservice.repository;

import com.cinema.supportservice.model.MessageInbox;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageInboxRepository extends JpaRepository<MessageInbox, String> {
}
