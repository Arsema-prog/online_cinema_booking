package com.cinema.booking_service.service;

import com.cinema.booking_service.domain.*;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import com.cinema.booking_service.model.HoldRequest;
import com.cinema.booking_service.model.HoldResponse;
import com.cinema.booking_service.model.SeatAvailability;
import com.cinema.booking_service.repository.BookingRepository;
import com.cinema.booking_service.repository.BookingSeatRepository;
import com.cinema.booking_service.repository.SeatHoldRepository;
import com.cinema.booking_service.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatHoldRepository seatHoldRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatRepository seatRepository;

    private static final int HOLD_TTL_MINUTES = 15; // hold duration

    private List<UUID> getAllSeatsForShow(UUID showId) {
        return seatRepository.findByShowId(showId).stream()
                .map(Seat::getId)
                .collect(Collectors.toList());
    }
    @Transactional
    public HoldResponse holdSeats(HoldRequest request) {

        // 1️⃣ Check if requested seats are already held or booked
        for (UUID seatId : request.getSeatIds()) {
            List<SeatHold> existingHolds = seatHoldRepository
                    .findByShowIdAndSeatIdAndStatus(request.getShowId(), seatId, SeatHoldStatus.ACTIVE);
            if (!existingHolds.isEmpty()) {
                throw new RuntimeException("Seat " + seatId + " is already held or booked.");
            }
        }

        // 2️⃣ Create booking
        Booking booking = Booking.builder()
                .id(UUID.randomUUID())
                .userId(request.getUserId())
                .showId(request.getShowId())
                .status(BookingStatus.SEATS_HELD)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        bookingRepository.save(booking);

        // 3️⃣ Create seat holds
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(HOLD_TTL_MINUTES);
        List<SeatHold> seatHolds = request.getSeatIds().stream()
                .map(seatId -> SeatHold.builder()
                        .id(UUID.randomUUID())
                        .bookingId(booking.getId())
                        .userId(request.getUserId())
                        .showId(request.getShowId())
                        .seatId(seatId)
                        .status(SeatHoldStatus.ACTIVE)
                        .expiresAt(expiresAt)
                        .build())
                .collect(Collectors.toList());

        seatHoldRepository.saveAll(seatHolds);

        // 4️⃣ Create booking seats (optional, useful for later)
        List<BookingSeat> bookingSeats = request.getSeatIds().stream()
                .map(seatId -> BookingSeat.builder()
                        .id(UUID.randomUUID())
                        .bookingId(booking.getId())
                        .showId(request.getShowId())
                        .seatId(seatId)
                        .status(BookingStatus.valueOf("SEATS_HELD"))
                        .build())
                .collect(Collectors.toList());

        bookingSeatRepository.saveAll(bookingSeats);

        // 5️⃣ Return response
        return HoldResponse.builder()
                .bookingId(booking.getId())
                .status(booking.getStatus())
                .heldSeatIds(request.getSeatIds())
                .expiresAt(expiresAt)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SeatAvailability> getAvailableSeats(UUID showId) {

        // 1️⃣ Get all active holds
        List<SeatHold> activeHolds = seatHoldRepository.findByShowIdAndStatus(showId, SeatHoldStatus.ACTIVE);

        Set<UUID> heldSeatIds = activeHolds.stream()
                .map(SeatHold::getSeatId)
                .collect(Collectors.toSet());

        // 2️⃣ Get all booked seats
        List<BookingSeat> bookedSeats = bookingSeatRepository.findByShowId(showId); // can adapt query
        Set<UUID> bookedSeatIds = bookedSeats.stream()
                .map(BookingSeat::getSeatId)
                .collect(Collectors.toSet());

        // 3️⃣ Construct response
        List<UUID> allSeats = getAllSeatsForShow(showId); // implement based on your theater layout
        List<SeatAvailability> response = new ArrayList<>();

        for (UUID seatId : allSeats) {
            String status = "AVAILABLE";
            if (heldSeatIds.contains(seatId)) status = "HELD";
            else if (bookedSeatIds.contains(seatId)) status = "BOOKED";

            response.add(SeatAvailability.builder()
                    .seatId(seatId)
                    .status(status)
                    .build());
        }

        return response;
    }

    @Transactional
    public void confirmBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Update Booking status
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Update BookingSeat status
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            seat.setStatus(BookingStatus.CONFIRMED);
        }
        bookingSeatRepository.saveAll(seats);

        // Update SeatHold status
        List<SeatHold> holds = seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE);
        for (SeatHold hold : holds) {
            hold.setStatus(SeatHoldStatus.EXPIRED); // or simply delete
        }
        seatHoldRepository.saveAll(holds);
    }

    @Transactional
    public void cancelBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Cancel seats
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            seat.setStatus(BookingStatus.CANCELLED);
        }
        bookingSeatRepository.saveAll(seats);

        // Remove holds
        seatHoldRepository.deleteByBookingId(bookingId);
    }

    @Scheduled(fixedRate = 120000) // every 1 minute
    @Transactional
    public void expireHolds() {
        List<SeatHold> expiredHolds = seatHoldRepository.findByStatusAndExpiresAtBefore(
                SeatHoldStatus.ACTIVE,
                LocalDateTime.now()
        );

        for (SeatHold hold : expiredHolds) {
            hold.setStatus(SeatHoldStatus.EXPIRED);
            seatHoldRepository.save(hold);

            // Optionally cancel booking if all seats are expired
            List<SeatHold> activeHolds = seatHoldRepository.findByBookingIdAndStatus(hold.getBookingId(), SeatHoldStatus.ACTIVE);
            if (activeHolds.isEmpty()) {
                cancelBooking(hold.getBookingId());
            }
        }
    }


}
