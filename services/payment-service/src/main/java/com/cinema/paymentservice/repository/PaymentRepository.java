package com.cinema.paymentservice.repository;

import com.cinema.paymentservice.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByStripeEventId(String stripeEventId);
    Optional<Payment> findByStripeSessionId(String stripeSessionId);
}