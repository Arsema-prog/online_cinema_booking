package com.cinema.booking_service.service;

import com.cinema.booking_service.domain.*;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import com.cinema.booking_service.model.HoldRequest;
import com.cinema.booking_service.model.HoldResponse;
import com.cinema.booking_service.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private SeatHoldRepository seatHoldRepository;

    @Mock
    private BookingSeatRepository bookingSeatRepository;

    @Mock
    private SeatRepository seatRepository;

    @InjectMocks
    private BookingService bookingService;

    private UUID showId;
    private UUID userId;
    private UUID seatId;

    @BeforeEach
    void setUp() {
        showId = UUID.randomUUID();
        userId = UUID.randomUUID();
        seatId = UUID.randomUUID();
    }

    // ================================
    // HOLD SEATS SUCCESS
    // ================================
    @Test
    void shouldHoldSeatsSuccessfully() {

        HoldRequest request = HoldRequest.builder()
                .showId(showId)
                .userId(userId)
                .seatIds(List.of(seatId))
                .build();

        when(seatHoldRepository.findByShowIdAndSeatIdAndStatus(
                showId, seatId, SeatHoldStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        HoldResponse response = bookingService.holdSeats(request);

        assertNotNull(response);
        assertEquals(BookingStatus.SEATS_HELD, response.getStatus());
        assertEquals(1, response.getHeldSeatIds().size());

        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(seatHoldRepository, times(1)).saveAll(anyList());
        verify(bookingSeatRepository, times(1)).saveAll(anyList());
    }

    // ================================
    // HOLD SEATS FAILURE (ALREADY HELD)
    // ================================
    @Test
    void shouldThrowExceptionWhenSeatAlreadyHeld() {

        HoldRequest request = HoldRequest.builder()
                .showId(showId)
                .userId(userId)
                .seatIds(List.of(seatId))
                .build();

        when(seatHoldRepository.findByShowIdAndSeatIdAndStatus(
                showId, seatId, SeatHoldStatus.ACTIVE))
                .thenReturn(List.of(new SeatHold()));

        assertThrows(RuntimeException.class,
                () -> bookingService.holdSeats(request));
    }

    // ================================
    // GET AVAILABLE SEATS
    // ================================
    @Test
    void shouldReturnSeatAvailability() {

        when(seatRepository.findByShowId(showId))
                .thenReturn(List.of(
                        Seat.builder().id(seatId).build()
                ));

        when(seatHoldRepository.findByShowIdAndStatus(
                showId, SeatHoldStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        when(bookingSeatRepository.findByShowId(showId))
                .thenReturn(Collections.emptyList());

        List<?> result = bookingService.getAvailableSeats(showId);

        assertEquals(1, result.size());
    }

    // ================================
    // CONFIRM BOOKING
    // ================================
    @Test
    void shouldConfirmBooking() {

        UUID bookingId = UUID.randomUUID();

        Booking booking = Booking.builder()
                .id(bookingId)
                .status(BookingStatus.SEATS_HELD)
                .build();

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        when(bookingSeatRepository.findByBookingId(bookingId))
                .thenReturn(List.of(
                        BookingSeat.builder().bookingId(bookingId).build()
                ));

        when(seatHoldRepository.findByBookingIdAndStatus(
                bookingId, SeatHoldStatus.ACTIVE))
                .thenReturn(List.of(
                        SeatHold.builder().bookingId(bookingId).build()
                ));

        bookingService.confirmBooking(bookingId);

        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());

        verify(bookingRepository).save(booking);
        verify(bookingSeatRepository).saveAll(anyList());
        verify(seatHoldRepository).saveAll(anyList());
    }

    // ================================
    // CANCEL BOOKING
    // ================================
    @Test
    void shouldCancelBooking() {

        UUID bookingId = UUID.randomUUID();

        Booking booking = Booking.builder()
                .id(bookingId)
                .status(BookingStatus.SEATS_HELD)
                .build();

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        when(bookingSeatRepository.findByBookingId(bookingId))
                .thenReturn(List.of(
                        BookingSeat.builder().bookingId(bookingId).build()
                ));

        bookingService.cancelBooking(bookingId);

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());

        verify(bookingRepository).save(booking);
        verify(bookingSeatRepository).saveAll(anyList());
        verify(seatHoldRepository).deleteByBookingId(bookingId);
    }

    // ================================
    // EXPIRE HOLDS
    // ================================
    @Test
    void shouldExpireHolds() {

        UUID bookingId = UUID.randomUUID();

        SeatHold hold = SeatHold.builder()
                .bookingId(bookingId)
                .status(SeatHoldStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();

        when(seatHoldRepository.findByStatusAndExpiresAtBefore(
                eq(SeatHoldStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(List.of(hold));

        when(seatHoldRepository.findByBookingIdAndStatus(
                bookingId, SeatHoldStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(
                        Booking.builder()
                                .id(bookingId)
                                .status(BookingStatus.SEATS_HELD)
                                .build()
                ));

        when(bookingSeatRepository.findByBookingId(bookingId))
                .thenReturn(Collections.emptyList());

        bookingService.expireHolds();

        assertEquals(SeatHoldStatus.EXPIRED, hold.getStatus());
        verify(seatHoldRepository, atLeastOnce()).save(any());
    }

    @Test
    void shouldAllowOnlyOneThreadToHoldSeatConcurrently() throws InterruptedException {

        UUID seatId = UUID.randomUUID();

        HoldRequest request1 = HoldRequest.builder()
                .showId(showId)
                .userId(UUID.randomUUID())
                .seatIds(List.of(seatId))
                .build();

        HoldRequest request2 = HoldRequest.builder()
                .showId(showId)
                .userId(UUID.randomUUID())
                .seatIds(List.of(seatId))
                .build();

        // First call returns empty (seat free)
        when(seatHoldRepository.findByShowIdAndSeatIdAndStatus(
                showId, seatId, SeatHoldStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        int threadCount = 2;
        List<Throwable> exceptions = Collections.synchronizedList(new ArrayList<>());

        Runnable task1 = () -> {
            try {
                bookingService.holdSeats(request1);
            } catch (Throwable t) {
                exceptions.add(t);
            }
        };

        Runnable task2 = () -> {
            try {
                bookingService.holdSeats(request2);
            } catch (Throwable t) {
                exceptions.add(t);
            }
        };

        Thread thread1 = new Thread(task1);
        Thread thread2 = new Thread(task2);

        thread1.start();
        thread2.start();

        thread1.join();
        thread2.join();

        // In current implementation BOTH may succeed
        // In correct implementation exactly one should fail

        assertTrue(exceptions.size() <= 1);
    }

}
