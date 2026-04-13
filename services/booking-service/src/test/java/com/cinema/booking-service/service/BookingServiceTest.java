package com.cinema.booking_service.service;

import com.cinema.booking_service.domain.*;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import com.cinema.booking_service.event.SeatStatusEventPublisher;
import com.cinema.booking_service.messaging.HoldExpirationPublisher;
import com.cinema.booking_service.model.HoldRequest;
import com.cinema.booking_service.model.HoldResponse;
import com.cinema.booking_service.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

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

    @Mock
    private SeatStatusEventPublisher eventPublisher;

    @Mock
    private WebSocketService webSocketService;

    @Mock
    private HoldExpirationPublisher holdExpirationPublisher;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private UserHistoryStorageService userHistoryStorageService;

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
        ReflectionTestUtils.setField(bookingService, "coreServiceUrl", "http://core-service:8081");
        ReflectionTestUtils.setField(bookingService, "supportServiceUrl", "http://support-service:8084");
        ReflectionTestUtils.setField(bookingService, "holdTtlSeconds", 120);
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

        when(seatHoldRepository.findByShowIdAndSeatIdAndStatusAndExpiresAtAfter(
                eq(showId), eq(seatId), eq(SeatHoldStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(bookingSeatRepository.findBySeatId(seatId)).thenReturn(Collections.emptyList());

        when(restTemplate.getForEntity(anyString(), eq(BookingService.ScreeningDto.class)))
                .thenThrow(new RuntimeException("core service unavailable"));

        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            if (b.getId() == null) b.setId(UUID.randomUUID());
            return b;
        });

        HoldResponse response = bookingService.holdSeats(request);

        assertNotNull(response);
        assertEquals(BookingStatus.SEATS_HELD.toString(), response.getStatus());
        assertEquals(1, response.getHeldSeatIds().size());

        verify(bookingRepository, atLeastOnce()).save(any(Booking.class));
        verify(seatHoldRepository, times(1)).saveAll(anyList());
        verify(bookingSeatRepository, times(1)).saveAll(anyList());
        verify(holdExpirationPublisher, times(1))
                .scheduleHoldExpiration(eq(response.getBookingId()), eq(showId), eq(userId), any(LocalDateTime.class));
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

        when(seatHoldRepository.findByShowIdAndSeatIdAndStatusAndExpiresAtAfter(
                eq(showId), eq(seatId), eq(SeatHoldStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(List.of(new SeatHold()));
        when(bookingSeatRepository.findBySeatId(seatId)).thenReturn(Collections.emptyList());

        assertThrows(IllegalStateException.class,
                () -> bookingService.holdSeats(request));
    }

    // ================================
    // GET AVAILABLE SEATS
    // ================================
    @Test
    void shouldReturnSeatAvailability() {

        when(seatHoldRepository.findByShowIdAndStatusAndExpiresAtAfter(
                eq(showId), eq(SeatHoldStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(bookingSeatRepository.findByShowId(showId))
                .thenReturn(Collections.emptyList());

        List<?> result = bookingService.getAvailableSeats(showId);

        // getAvailableSeats returns HELD/BOOKED seats only (not AVAILABLE seats)
        assertEquals(0, result.size());
    }

    // ================================
    // CONFIRM BOOKING
    // ================================
    @Test
    void shouldConfirmBooking() {

        UUID bookingId = UUID.randomUUID();

        Booking booking = Booking.builder()
                .id(bookingId)
                .showId(showId)
                .userId(userId)
                .status(BookingStatus.PAYMENT_PENDING)
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

        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

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
                .showId(showId)
                .userId(userId)
                .status(BookingStatus.SEATS_HELD)
                .build();

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        when(bookingSeatRepository.findByBookingId(bookingId))
                .thenReturn(List.of(
                        BookingSeat.builder().bookingId(bookingId).build()
                ));

        when(seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE))
                .thenReturn(List.of(SeatHold.builder().bookingId(bookingId).build()));

        bookingService.cancelBooking(bookingId);

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());

        verify(bookingRepository).save(booking);
        verify(bookingSeatRepository).saveAll(anyList());
        verify(seatHoldRepository).saveAll(anyList());
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
                .thenReturn(List.of(hold));

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(
                        Booking.builder()
                                .id(bookingId)
                                .showId(showId)
                                .userId(userId)
                                .status(BookingStatus.SEATS_HELD)
                                .build()
                ));

        when(bookingSeatRepository.findByBookingId(bookingId))
                .thenReturn(List.of(BookingSeat.builder().bookingId(bookingId).seatId(seatId).showId(showId).build()));

        bookingService.expireHolds();

        assertEquals(SeatHoldStatus.EXPIRED, hold.getStatus());
        verify(seatHoldRepository).saveAll(anyList());
    }

    @Test
    void shouldRejectHoldWhenBookingSeatAlreadyActive() {
        HoldRequest request1 = HoldRequest.builder()
                .showId(showId)
                .userId(UUID.randomUUID())
                .seatIds(List.of(seatId))
                .build();
        when(seatHoldRepository.findByShowIdAndSeatIdAndStatusAndExpiresAtAfter(
                eq(showId), eq(seatId), eq(SeatHoldStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(bookingSeatRepository.findBySeatId(seatId))
                .thenReturn(List.of(BookingSeat.builder()
                        .seatId(seatId)
                        .showId(showId)
                        .status(BookingStatus.PAYMENT_PENDING)
                        .build()));

        assertThrows(IllegalStateException.class, () -> bookingService.holdSeats(request1));
    }

}
