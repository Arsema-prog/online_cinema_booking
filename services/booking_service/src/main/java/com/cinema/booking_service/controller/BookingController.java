package com.cinema.booking_service.controller;

import com.cinema.booking_service.model.HoldRequest;
import com.cinema.booking_service.model.HoldResponse;
import com.cinema.booking_service.model.SeatAvailability;
import com.cinema.booking_service.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/hold")
    public ResponseEntity<HoldResponse> holdSeats(@RequestBody HoldRequest request) {
        HoldResponse response = bookingService.holdSeats(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/shows/{showId}/seats")
    public List<SeatAvailability> getAvailableSeats(@PathVariable UUID showId) {
        return bookingService.getAvailableSeats(showId);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<Void> confirm(@PathVariable UUID id) {
        bookingService.confirmBooking(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.ok().build();
    }


}
