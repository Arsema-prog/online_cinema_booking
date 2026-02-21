package com.cinema.supportservice.repository;

import com.cinema.supportservice.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    boolean existsByBookingId(Long bookingId);

    List<Ticket> findByBookingId(Long bookingId);

    List<Ticket> findByUserId(Long userId);
}