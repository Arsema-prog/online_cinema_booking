package com.cinema.paymentservice.repository;

import com.cinema.paymentservice.model.PaymentEventInbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentEventInboxRepository extends JpaRepository<PaymentEventInbox, String> {
}
