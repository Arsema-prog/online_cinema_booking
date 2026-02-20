package com.cinema.booking_service.service;

import com.cinema.booking_service.domain.SeatHold;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import com.cinema.booking_service.repository.BookingRepository;
import com.cinema.booking_service.repository.SeatHoldRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeatHoldCleanupService {

    private final SeatHoldRepository seatHoldRepository;
    private final BookingRepository bookingRepository;

    @Scheduled(fixedRate = 120000)
    @Transactional
    public void cleanupExpiredHolds() {

        List<SeatHold> expired = seatHoldRepository
                .findByStatusAndExpiresAtBefore(
                        SeatHoldStatus.ACTIVE,
                        LocalDateTime.now()
                );

        if (expired.isEmpty()) return;

        Set<UUID> bookingIds = expired.stream()
                .map(SeatHold::getBookingId)
                .collect(Collectors.toSet());

        seatHoldRepository.deleteAll(expired);

        bookingRepository.findAllById(bookingIds).forEach(b -> {
            b.setStatus(BookingStatus.CANCELLED);
            b.setUpdatedAt(LocalDateTime.now());
        });
    }
}
