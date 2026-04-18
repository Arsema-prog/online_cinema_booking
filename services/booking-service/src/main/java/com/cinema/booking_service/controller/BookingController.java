package com.cinema.booking_service.controller;

import com.cinema.booking_service.domain.Booking;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.dto.BookingDTO;
import com.cinema.booking_service.dto.BookingSeatDto;
import com.cinema.booking_service.dto.ConfirmBookingRequest;
import com.cinema.booking_service.dto.UserHistoryBookingDto;
import com.cinema.booking_service.model.HoldRequest;
import com.cinema.booking_service.model.HoldResponse;
import com.cinema.booking_service.model.SeatAvailability;
import com.cinema.booking_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/hold")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<HoldResponse> holdSeats(@Valid @RequestBody HoldRequest request) {
        HoldResponse response = bookingService.holdSeats(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/shows/{showId}/seats")
    public List<SeatAvailability> getAvailableSeats(@PathVariable UUID showId) {
        return bookingService.getAvailableSeats(showId);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.ok().build();
    }

    // NEW: Get all bookings (raw entities)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<Booking>> getAllBookings() {
        List<Booking> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    // NEW: Get all bookings as DTOs
    @GetMapping("/dto")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingDTO>> getAllBookingDTOs() {
        List<BookingDTO> bookings = bookingService.getAllBookingDTOs();
        return ResponseEntity.ok(bookings);
    }

//    @PostMapping("/{id}/confirm")
//    public ResponseEntity<Void> confirm(@PathVariable UUID id, @RequestBody ConfirmBookingRequest request) {
//        bookingService.confirmBooking(id, request.getUserEmail());
//        return ResponseEntity.ok().build();
//    }
//    // NEW: Get all bookings with seat count
    @GetMapping("/with-seat-count")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingDTO>> getAllBookingsWithSeatCount() {
        List<BookingDTO> bookings = bookingService.getAllBookingsWithSeatCount();
        return ResponseEntity.ok(bookings);
    }

    // NEW: Get booking by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Booking> getBookingById(@PathVariable UUID id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/seats")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingSeatDto>> getBookingSeats(@PathVariable UUID id) {
        List<BookingSeatDto> seats = bookingService.getBookingSeats(id);
        return ResponseEntity.ok(seats);
    }
    // NEW: Get bookings by user ID
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<UserHistoryBookingDto>> getBookingsByUser(@PathVariable UUID userId) {
        List<UserHistoryBookingDto> bookings = bookingService.getBookingsByUser(userId);
        return ResponseEntity.ok(bookings);
    }

    // NEW: Get bookings by status
    
    @PostMapping("/{id}/snacks")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Booking> addSnacks(@PathVariable UUID id, @RequestBody com.cinema.booking_service.dto.SnackRequest request) {
        return ResponseEntity.ok(bookingService.updateBookingWithSnacks(id, request.getSnackDetails(), request.getSnacksTotal()));
    }

    @PostMapping("/{id}/initiate-payment")
    @PreAuthorize("hasAnyRole('USER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Booking> initiatePayment(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.initiatePayment(id));
    }

}
