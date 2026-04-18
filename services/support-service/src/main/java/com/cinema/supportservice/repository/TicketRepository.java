package com.cinema.supportservice.repository;

import com.cinema.supportservice.model.Ticket;
import com.cinema.supportservice.model.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    boolean existsByBookingId(Long bookingId);

    List<Ticket> findByBookingId(Long bookingId);

    List<Ticket> findByUserId(Long userId);

    Optional<Ticket> findByValidationToken(String validationToken);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Ticket t
            set t.isUsed = true,
                t.usedAt = :usedAt,
                t.validatedAt = :validatedAt,
                t.status = :status
            where t.id = :ticketId
              and t.isUsed = false
            """)
    int markTicketUsedIfUnused(
            @Param("ticketId") UUID ticketId,
            @Param("usedAt") LocalDateTime usedAt,
            @Param("validatedAt") LocalDateTime validatedAt,
            @Param("status") TicketStatus status
    );
}
