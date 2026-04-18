package com.cinema.booking_service.service;

import java.util.Optional;
import com.cinema.booking_service.domain.*;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import com.cinema.booking_service.dto.BookingConfirmedEvent;
import com.cinema.booking_service.dto.BookingDTO;
import com.cinema.booking_service.dto.BookingSeatDto;
import com.cinema.booking_service.dto.HistorySeatDto;
import com.cinema.booking_service.dto.UserHistoryBookingDto;
import com.cinema.booking_service.event.SeatStatusEventPublisher;
import com.cinema.booking_service.messaging.HoldExpirationPublisher;
import com.cinema.booking_service.model.HoldRequest;
import com.cinema.booking_service.model.HoldResponse;
import com.cinema.booking_service.model.SeatAvailability;
import com.cinema.booking_service.repository.BookingRepository;
import com.cinema.booking_service.repository.BookingSeatRepository;
import com.cinema.booking_service.repository.SeatHoldRepository;
import com.cinema.booking_service.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

import static com.cinema.booking_service.config.RabbitConfig.BOOKING_EXCHANGE;
import static com.cinema.booking_service.config.RabbitConfig.BOOKING_CONFIRMED_ROUTING_KEY;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatHoldRepository seatHoldRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatRepository seatRepository;
    private final SeatStatusEventPublisher eventPublisher;
    private final WebSocketService webSocketService;
    private final HoldExpirationPublisher holdExpirationPublisher;
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;
    private final UserHistoryStorageService userHistoryStorageService;

    @Value("${core.service.url:http://localhost:8081}")
    private String coreServiceUrl;

    @Value("${support.service.url:http://support-service:8084}")
    private String supportServiceUrl;

    @Value("${booking.hold.ttl-seconds:120}")
    private int holdTtlSeconds;

    private List<UUID> getAllSeatsForShow(UUID showId) {
        if (showId == null) {
            log.warn("Cannot get seats for null showId");
            return Collections.emptyList();
        }

        return seatRepository.findByShowId(showId).stream()
                .map(Seat::getId)
                .collect(Collectors.toList());
    }
    public List<BookingSeatDto> getBookingSeats(UUID bookingId) {
        List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);

        return bookingSeats.stream()
                .map(bs -> {
                    Seat seat = seatRepository.findById(bs.getSeatId()).orElse(null);
                    if (seat != null) {
                        return new BookingSeatDto(
                                seat.getRow() + seat.getNumber(),
                                seat.getRow(),
                                seat.getNumber()
                        );
                    }
                    String label = getSeatNumber(bs.getSeatId());
                    return new BookingSeatDto(label, null, 0);
                })
                .collect(Collectors.toList());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public HoldResponse holdSeats(HoldRequest request) {
        if (request == null || request.getShowId() == null || request.getSeatIds() == null
                || request.getSeatIds().isEmpty() || request.getUserId() == null) {
            throw new IllegalArgumentException("Invalid hold request: missing required fields");
        }

        log.info("Holding seats for show: {}, seats: {}", request.getShowId(), request.getSeatIds());

        assertNoActiveSeatConflicts(request.getShowId(), request.getSeatIds());

        upsertSeatMetadataFromCore(request.getShowId(), request.getSeatIds());

        ShowDetails showDetails = fetchShowDetails(request.getShowId());
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(holdTtlSeconds);

        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .showId(request.getShowId())
                .movieTitle(showDetails.getMovieTitle())
                .branchName(showDetails.getBranchName())
                .screenName(showDetails.getScreenName())
                .showTime(showDetails.getShowTime())
                .status(BookingStatus.SEATS_HELD)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .totalAmount(evaluateSeatPricing(request.getSeatIds().size(), showDetails.getShowTime()))
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        UUID bookingId = savedBooking.getId();

        List<SeatHold> seatHolds = request.getSeatIds().stream()
                .map(seatId -> SeatHold.builder()
                        .id(UUID.randomUUID())
                        .bookingId(bookingId)
                        .userId(request.getUserId())
                        .showId(request.getShowId())
                        .seatId(seatId)
                        .status(SeatHoldStatus.ACTIVE)
                        .expiresAt(expiresAt)
                        .build())
                .collect(Collectors.toList());

        List<BookingSeat> bookingSeats = request.getSeatIds().stream()
                .map(seatId -> BookingSeat.builder()
                        .id(UUID.randomUUID())
                        .bookingId(bookingId)
                        .showId(request.getShowId())
                        .seatId(seatId)
                        .status(BookingStatus.SEATS_HELD)
                        .build())
                .collect(Collectors.toList());

        try {
            seatHoldRepository.saveAll(seatHolds);
            bookingSeatRepository.saveAll(bookingSeats);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Seat hold conflict detected for booking {} on show {}", bookingId, request.getShowId(), ex);
            throw new IllegalStateException("One or more requested seats are no longer available", ex);
        }

        for (UUID seatId : request.getSeatIds()) {
            webSocketService.broadcastSeatUpdate(
                    request.getShowId(),
                    SeatAvailability.builder().seatId(seatId).status("HELD").build()
            );
        }

        HoldResponse response = HoldResponse.builder()
                .bookingId(bookingId)
                .status(savedBooking.getStatus().toString())
                .heldSeatIds(request.getSeatIds())
                .expiresAt(expiresAt)
                .expiresAtEpochMs(expiresAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();

        holdExpirationPublisher.scheduleHoldExpiration(
                bookingId,
                request.getShowId(),
                request.getUserId(),
                expiresAt
        );

        try {
            eventPublisher.publishSeatHeldEvent(
                    request.getShowId(),
                    convertUuidToNumericIds(request.getSeatIds()),
                    response.getBookingId(),
                    request.getUserId().toString()
            );
        } catch (Exception e) {
            log.error("Failed to publish seat held event", e);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<SeatAvailability> getAvailableSeats(UUID showId) {
        if (showId == null) {
            log.warn("Cannot get available seats for null showId");
            return Collections.emptyList();
        }

        // 1️⃣ Get all active holds
        List<SeatHold> activeHolds = seatHoldRepository.findByShowIdAndStatusAndExpiresAtAfter(
                showId,
                SeatHoldStatus.ACTIVE,
                LocalDateTime.now()
        );

        Set<UUID> heldSeatIds = activeHolds.stream()
                .map(SeatHold::getSeatId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 2️⃣ Get all booked seats
        List<BookingSeat> bookedSeats = bookingSeatRepository.findByShowId(showId).stream()
                .filter(bs -> bs.getStatus() == BookingStatus.CONFIRMED)
                .collect(Collectors.toList());
        Set<UUID> bookedSeatIds = bookedSeats.stream()
                .map(BookingSeat::getSeatId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 3️⃣ Construct response from active holds and confirmed bookings directly
        List<SeatAvailability> response = new ArrayList<>();

        for (UUID seatId : heldSeatIds) {
            response.add(SeatAvailability.builder()
                    .seatId(seatId)
                    .status("HELD")
                    .build());
        }

        for (UUID seatId : bookedSeatIds) {
            if (!heldSeatIds.contains(seatId)) {
                response.add(SeatAvailability.builder()
                        .seatId(seatId)
                        .status("BOOKED")
                        .build());
            }
        }

        return response;
    }

    @Transactional
    public void confirmBooking(UUID bookingId) {
        confirmBooking(bookingId, null);

    }

    @Transactional
    public void confirmBooking(UUID bookingId, String userEmail) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }

        String normalizedUserEmail = (userEmail != null && !userEmail.trim().isEmpty()) ? userEmail.trim() : null;

        Booking booking = getRequiredBooking(bookingId);
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("Booking {} already confirmed, skipping duplicate confirmation", bookingId);
            return;
        }
        if (isTerminalStatus(booking.getStatus())) {
            log.warn("Ignoring payment success for booking {} in terminal state {}", bookingId, booking.getStatus());
            return;
        }
        if (!EnumSet.of(BookingStatus.PAYMENT_INITIATED, BookingStatus.PAYMENT_PENDING).contains(booking.getStatus())) {
            throw new IllegalStateException("Cannot confirm booking from state " + booking.getStatus());
        }

        List<SeatHold> holds = seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE);
        if (holds.isEmpty()) {
            log.warn("Ignoring payment success for booking {} because no active holds remain", bookingId);
            return;
        }

        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            if (seat != null) {
                seat.setStatus(BookingStatus.CONFIRMED);
            }
        }
        bookingSeatRepository.saveAll(seats);

        for (SeatHold hold : holds) {
            if (hold != null) {
                hold.setStatus(SeatHoldStatus.CONVERTED);
            }
        }
        seatHoldRepository.saveAll(holds);

        booking.setStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);
        log.info("Updated booking status to CONFIRMED: {}", bookingId);

        for (BookingSeat seat : seats) {
            if (seat != null && seat.getSeatId() != null) {
                webSocketService.broadcastSeatUpdate(
                        booking.getShowId(),
                        SeatAvailability.builder().seatId(seat.getSeatId()).status("BOOKED").build()
                );
            }
        }

        publishBookingConfirmedEvent(booking, seats, normalizedUserEmail);

        List<String> seatNumbers = seats.stream()
                .filter(Objects::nonNull)
                .map(BookingSeat::getSeatId)
                .map(this::getSeatNumber)
                .collect(Collectors.toList());
        userHistoryStorageService.saveConfirmedBooking(booking, seatNumbers);

        try {
            eventPublisher.publishSeatReservedEvent(
                    booking.getShowId(),
                    getSeatIdsFromBooking(bookingId),
                    bookingId,
                    booking.getUserId() != null ? booking.getUserId().toString() : "unknown"
            );
        } catch (Exception e) {
            log.error("Failed to publish seat reserved event", e);
        }

        log.info("Booking confirmed successfully: {}", bookingId);
    }

    @Transactional
    public void cancelBooking(UUID bookingId) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }

        Booking booking = getRequiredBooking(bookingId);
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Confirmed bookings must be cancelled through the refund workflow");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            log.info("Booking {} already cancelled", bookingId);
            return;
        }

        releaseInventory(booking, BookingStatus.CANCELLED, SeatHoldStatus.RELEASED, true);
        log.info("Booking cancelled: {}", bookingId);
    }

    @Transactional(readOnly = true)
    public Optional<Booking> getBookingById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return bookingRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<UserHistoryBookingDto> getBookingsByUser(UUID userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        List<UserHistoryBookingDto> history = userHistoryStorageService.getUserBookings(userId);
        if (history.isEmpty()) {
            log.warn("MinIO history empty for user {}, rebuilding from confirmed bookings in database", userId);
            return bookingRepository.findByUserId(userId).stream()
                    .filter(Objects::nonNull)
                    .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                    .map(this::buildHistoryDtoFromBooking)
                    .collect(Collectors.toList());
        }
        return history.stream().map(this::enrichHistoryFromDatabaseIfNeeded).collect(Collectors.toList());
    }

    // Add this method to get all bookings
    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Add this method to get all bookings as DTOs
    @Transactional(readOnly = true)
    public List<BookingDTO> getAllBookingDTOs() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Add this method to get bookings with seat count
    @Transactional(readOnly = true)
    public List<BookingDTO> getAllBookingsWithSeatCount() {
        List<Booking> bookings = bookingRepository.findAll();

        return bookings.stream()
                .map(booking -> {
                    int seatCount = bookingSeatRepository.countByBookingId(booking.getId());
                    return convertToDTO(booking, seatCount);
                })
                .collect(Collectors.toList());
    }

    // Helper method to convert Booking to DTO
    private BookingDTO convertToDTO(Booking booking) {
        if (booking == null) {
            return null;
        }

        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .showId(booking.getShowId())
                .status(booking.getStatus() != null ? booking.getStatus().toString() : "UNKNOWN")
                .movieTitle(booking.getMovieTitle())
                .branchName(booking.getBranchName())
                .screenName(booking.getScreenName())
                .showTime(booking.getShowTime())
                .totalAmount(booking.getTotalAmount())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    // Helper method with seat count
    private BookingDTO convertToDTO(Booking booking, int seatCount) {
        BookingDTO dto = convertToDTO(booking);
        if (dto != null) {
            dto.setSeatCount(seatCount);
        }
        return dto;
    }

    @Transactional
    public Booking updateBookingWithSnacks(UUID bookingId, String snackDetails, BigDecimal snacksTotal) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        
        if (booking.getStatus() != BookingStatus.SEATS_HELD && booking.getStatus() != BookingStatus.SNACKS_SELECTED) {
            throw new IllegalStateException("Booking must be in SEATS_HELD state to add snacks, current state: " + booking.getStatus());
        }

        booking.setSnackDetails(snackDetails);
        booking.setSnacksTotal(snacksTotal != null ? snacksTotal : BigDecimal.ZERO);
        
        // Update total amount: base seats + snacks
        int seatCount = bookingSeatRepository.countByBookingId(bookingId);
        BigDecimal seatsTotal = evaluateSeatPricing(seatCount, booking.getShowTime());
        booking.setTotalAmount(seatsTotal.add(booking.getSnacksTotal()));

        booking.setStatus(BookingStatus.SNACKS_SELECTED);
        log.info("Added snacks to booking {}, new total: {}", bookingId, booking.getTotalAmount());
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking initiatePayment(UUID bookingId) {
        Booking booking = getRequiredBooking(bookingId);

        if (booking.getStatus() == BookingStatus.PAYMENT_PENDING || booking.getStatus() == BookingStatus.PAYMENT_INITIATED) {
            return booking;
        }

        if (booking.getStatus() != BookingStatus.SEATS_HELD && booking.getStatus() != BookingStatus.SNACKS_SELECTED) {
            throw new IllegalStateException("Cannot initiate payment from state: " + booking.getStatus());
        }
        if (seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE).isEmpty()) {
            throw new IllegalStateException("Cannot initiate payment without active seat holds");
        }

        booking.setStatus(BookingStatus.PAYMENT_PENDING);
        log.info("Payment pending for booking {}", bookingId);
        return bookingRepository.save(booking);
    }

    @Transactional
    public void failBooking(UUID bookingId) {
        Booking booking = getRequiredBooking(bookingId);

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.warn("Ignoring payment failure compensation for already confirmed booking {}", bookingId);
            return;
        }
        if (booking.getStatus() == BookingStatus.FAILED) {
            log.info("Booking {} already failed", bookingId);
            return;
        }
        if (booking.getStatus() == BookingStatus.EXPIRED || booking.getStatus() == BookingStatus.CANCELLED) {
            log.info("Booking {} already released in state {}", bookingId, booking.getStatus());
            return;
        }

        releaseInventory(booking, BookingStatus.FAILED, SeatHoldStatus.RELEASED, true);
        log.info("Booking {} failed. Compensation actions executed.", bookingId);
    }

    @Scheduled(fixedRate = 10000) // every 10 seconds
    @Transactional
    public void expireHolds() {
        Set<UUID> expiredBookingIds = seatHoldRepository.findByStatusAndExpiresAtBefore(
                        SeatHoldStatus.ACTIVE,
                        LocalDateTime.now()
                ).stream()
                .map(SeatHold::getBookingId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (UUID bookingId : expiredBookingIds) {
            expireBookingDueToTimeout(bookingId);
        }
    }

    @Transactional
    public void expireBookingDueToTimeout(UUID bookingId) {
        Booking booking = getRequiredBooking(bookingId);
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.info("Skipping timeout expiration for confirmed booking {}", bookingId);
            return;
        }
        if (booking.getStatus() == BookingStatus.EXPIRED) {
            log.info("Booking {} already expired", bookingId);
            return;
        }
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.FAILED) {
            log.info("Booking {} already released in state {}", bookingId, booking.getStatus());
            return;
        }

        releaseInventory(booking, BookingStatus.EXPIRED, SeatHoldStatus.EXPIRED, true);
        log.info("Booking {} expired after hold timeout", bookingId);
    }

    // ==================== HELPER METHODS ====================

    private Booking getRequiredBooking(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
    }

    private void assertNoActiveSeatConflicts(UUID showId, List<UUID> seatIds) {
        LocalDateTime now = LocalDateTime.now();
        for (UUID seatId : seatIds) {
            boolean held = !seatHoldRepository.findByShowIdAndSeatIdAndStatusAndExpiresAtAfter(
                    showId,
                    seatId,
                    SeatHoldStatus.ACTIVE,
                    now
            ).isEmpty();

            boolean booked = bookingSeatRepository.findBySeatId(seatId).stream()
                    .anyMatch(existing -> existing.getShowId() != null
                            && existing.getShowId().equals(showId)
                            && EnumSet.of(
                                    BookingStatus.SEATS_HELD,
                                    BookingStatus.PAYMENT_INITIATED,
                                    BookingStatus.PAYMENT_PENDING,
                                    BookingStatus.CONFIRMED
                            ).contains(existing.getStatus()));

            if (held || booked) {
                throw new IllegalStateException("Seat " + seatId + " is already held or booked.");
            }
        }
    }

    private boolean isTerminalStatus(BookingStatus status) {
        return status == BookingStatus.CONFIRMED
                || status == BookingStatus.FAILED
                || status == BookingStatus.EXPIRED
                || status == BookingStatus.CANCELLED;
    }

    private void releaseInventory(
            Booking booking,
            BookingStatus finalBookingStatus,
            SeatHoldStatus finalHoldStatus,
            boolean publishSeatCancellationEvent
    ) {
        UUID bookingId = booking.getId();
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            if (seat != null) {
                seat.setStatus(finalBookingStatus);
            }
        }
        bookingSeatRepository.saveAll(seats);

        List<SeatHold> activeHolds = seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE);
        for (SeatHold hold : activeHolds) {
            if (hold != null) {
                hold.setStatus(finalHoldStatus);
            }
        }
        if (!activeHolds.isEmpty()) {
            seatHoldRepository.saveAll(activeHolds);
        }

        booking.setStatus(finalBookingStatus);
        bookingRepository.save(booking);

        for (BookingSeat seat : seats) {
            if (seat != null && seat.getSeatId() != null) {
                webSocketService.broadcastSeatUpdate(
                        booking.getShowId(),
                        SeatAvailability.builder().seatId(seat.getSeatId()).status("AVAILABLE").build()
                );
            }
        }

        if (publishSeatCancellationEvent && !seats.isEmpty()) {
            try {
                eventPublisher.publishSeatCancelledEvent(
                        booking.getShowId(),
                        getSeatIdsFromBooking(bookingId),
                        bookingId,
                        booking.getUserId() != null ? booking.getUserId().toString() : "unknown"
                );
            } catch (Exception e) {
                log.error("Failed to publish seat cancellation event for booking {}", bookingId, e);
            }
        }
    }

    /**
     * Fetches show details from core service
     */
    private ShowDetails fetchShowDetails(UUID showId) {
        if (showId == null) {
            log.warn("Cannot fetch details for null showId");
            return ShowDetails.builder()
                    .movieTitle("Unknown Movie")
                    .branchName("Unknown Branch")
                    .screenName("Unknown Screen")
                    .showTime(LocalDateTime.now().plusDays(1))
                    .build();
        }

        try {
            Long numericShowId = extractNumericIdFromUuid(showId);
            // Convert numeric ID to string for API call
            String url = coreServiceUrl + "/screenings/" + numericShowId;
            log.info("Fetching show details from: {}", url);

            ResponseEntity<ScreeningDto> response = restTemplate.getForEntity(url, ScreeningDto.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                ScreeningDto screening = response.getBody();

                // Safely extract details with null checks
                String movieTitle = screening.getMovie() != null ? screening.getMovie().getTitle() : "Unknown Movie";
                String branchName = (screening.getScreen() != null && screening.getScreen().getBranch() != null)
                        ? screening.getScreen().getBranch().getName() : "Unknown Branch";
                String screenName = screening.getScreen() != null ? screening.getScreen().getName() : "Unknown Screen";
                LocalDateTime showTime = screening.getStartTime() != null ? screening.getStartTime() : LocalDateTime.now();

                return ShowDetails.builder()
                        .movieTitle(movieTitle)
                        .branchName(branchName)
                        .screenName(screenName)
                        .showTime(showTime)
                        .build();
            } else {
                throw new RuntimeException("Failed to fetch screening details, status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to fetch show details for showId: {}", showId, e);
            // Return default values for testing/fallback
            return ShowDetails.builder()
                    .movieTitle("Movie " + generateShortId(showId))
                    .branchName("Main Branch")
                    .screenName("Screen 1")
                    .showTime(LocalDateTime.now().plusDays(1))
                    .build();
        }
    }

    /**
     * Generates a short ID from UUID for fallback display
     */
    private String generateShortId(UUID uuid) {
        if (uuid == null) return "Unknown";
        String uuidStr = uuid.toString();
        return uuidStr.substring(0, Math.min(8, uuidStr.length()));
    }

    /**
     * Screening "show" IDs from the UI are synthetic UUID strings of the form
     * {@code 00000000-0000-0000-0000-XXXXXXXXXXXX} where the last segment is a
     * <strong>decimal</strong> zero-padded screening id (same contract as core-service
     * {@code findScreeningIdByUuid}). Java's {@link UUID#fromString} interprets that
     * segment as hex, so we must parse the string — not the UUID bits.
     */
    private Long extractNumericIdFromUuid(UUID uuid) {
        if (uuid == null) {
            return 0L;
        }
        String uuidStr = uuid.toString();
        String[] parts = uuidStr.split("-");
        if (parts.length >= 5) {
            String lastPart = parts[4];
            String numericPart = lastPart.replaceFirst("^0+(?!$)", "");
            if (numericPart.isEmpty()) {
                numericPart = "0";
            }
            try {
                return Long.parseLong(numericPart);
            } catch (NumberFormatException ignored) {
                try {
                    return Long.parseUnsignedLong(lastPart, 16);
                } catch (NumberFormatException ignored2) {
                    // fall through
                }
            }
        }
        long numericId = uuid.getMostSignificantBits() ^ uuid.getLeastSignificantBits();
        return Math.abs(numericId);
    }

    /**
     * Core maps each physical seat to {@code new UUID(0L, coreSeatId)} for booking-service.
     */
    private long toCoreSeatId(UUID bookingSeatUuid) {
        if (bookingSeatUuid == null) {
            return 0L;
        }
        if (bookingSeatUuid.getMostSignificantBits() == 0L) {
            return bookingSeatUuid.getLeastSignificantBits();
        }
        return Math.abs(bookingSeatUuid.getMostSignificantBits() ^ bookingSeatUuid.getLeastSignificantBits());
    }

    private void upsertSeatMetadataFromCore(UUID showId, List<UUID> seatIds) {
        if (showId == null || seatIds == null || seatIds.isEmpty()) {
            return;
        }
        for (UUID seatUuid : seatIds) {
            if (seatUuid == null) {
                continue;
            }
            long coreSeatId = toCoreSeatId(seatUuid);
            if (coreSeatId <= 0) {
                continue;
            }
            try {
                ResponseEntity<CoreSeatResponse> response = restTemplate.getForEntity(
                        coreServiceUrl + "/seats/" + coreSeatId,
                        CoreSeatResponse.class
                );
                if (response == null || !response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                    log.warn("Core returned no seat body for coreSeatId {}", coreSeatId);
                    continue;
                }
                CoreSeatResponse body = response.getBody();
                int number = parseSeatNumberInt(body.getSeatNumber());
                Seat seat = Seat.builder()
                        .id(seatUuid)
                        .showId(showId)
                        .row(body.getRowLabel() != null ? body.getRowLabel() : "?")
                        .number(number)
                        .build();
                seatRepository.save(seat);
            } catch (Exception e) {
                log.warn("Could not sync seat {} (core id {}) from core-service: {}", seatUuid, coreSeatId, e.getMessage());
            }
        }
    }

    private static int parseSeatNumberInt(String seatNumber) {
        if (seatNumber == null || seatNumber.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(seatNumber.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    @lombok.Data
    private static class CoreSeatResponse {
        private Long id;
        private String seatNumber;
        private String rowLabel;
    }

    /**
     * Publishes booking confirmed event to RabbitMQ for ticket generation
     */
    private void publishBookingConfirmedEvent(Booking booking, List<BookingSeat> seats, String userEmail) {
        if (booking == null) {
            log.warn("Cannot publish event: booking is null");
            return;
        }

        if (seats == null || seats.isEmpty()) {
            log.warn("Cannot publish event: seats list is null or empty for booking: {}", booking.getId());
            return;
        }

        if (booking.getUserId() == null) {
            log.warn("Booking {} has null userId, cannot publish event", booking.getId());
        }

        // Get seat numbers safely
        List<String> seatNumbers = seats.stream()
                .filter(Objects::nonNull)
                .map(bs -> getSeatNumber(bs.getSeatId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Create the event object
        BookingConfirmedEvent event = new BookingConfirmedEvent(
                booking.getId(),
                booking.getUserId(),
                userEmail,
                booking.getMovieTitle() != null ? booking.getMovieTitle() : "Unknown Movie",
                booking.getBranchName() != null ? booking.getBranchName() : "Unknown Branch",
                booking.getScreenName() != null ? booking.getScreenName() : "Unknown Screen",
                booking.getShowTime() != null ? booking.getShowTime() : LocalDateTime.now(),
                seatNumbers,
                booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO
        );

        // Publish to RabbitMQ
        try {
            rabbitTemplate.convertAndSend(
                    BOOKING_EXCHANGE,
                    BOOKING_CONFIRMED_ROUTING_KEY,
                    event
            );
            log.info("Published booking confirmed event for booking: {}", booking.getId());
        } catch (Exception e) {
            log.error("Failed to publish booking confirmed event for booking: {}", booking.getId(), e);
        }
    }

    /**
     * Converts UUID seat IDs to numeric IDs for core service
     * This creates a stable numeric identifier from each UUID
     */
    private List<Long> convertUuidToNumericIds(List<UUID> uuidSeatIds) {
        if (uuidSeatIds == null || uuidSeatIds.isEmpty()) {
            return Collections.emptyList();
        }

        return uuidSeatIds.stream()
                .filter(Objects::nonNull)
                .map(this::toCoreSeatId)
                .collect(Collectors.toList());
    }

    /**
     * Gets seat IDs from booking as numeric values for core service
     */
    private List<Long> getSeatIdsFromBooking(UUID bookingId) {
        if (bookingId == null) {
            return Collections.emptyList();
        }

        List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);
        if (bookingSeats == null || bookingSeats.isEmpty()) {
            return Collections.emptyList();
        }

        return bookingSeats.stream()
                .filter(Objects::nonNull)
                .map(bs -> {
                    if (bs.getSeatId() == null) {
                        log.warn("Seat ID is null for booking seat: {}", bs.getId());
                        return 0L;
                    }
                    return toCoreSeatId(bs.getSeatId());
                })
                .filter(id -> id != 0L)
                .collect(Collectors.toList());
    }

    /**
     * Gets seat number from seat ID
     */
    private String getSeatNumber(UUID seatId) {
        if (seatId == null) {
            return "UNKNOWN";
        }

        // Try to get seat number from database
        try {
            Optional<Seat> seatOpt = seatRepository.findById(seatId);
            if (seatOpt.isPresent()) {
                Seat seat = seatOpt.get();
                if (seat.getRow() != null && seat.getNumber() != null) {
                    return seat.getRow() + seat.getNumber();
                } else if (seat.getNumber() != null) {
                    return "Seat " + seat.getNumber();
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch seat from database: {}", e.getMessage());
        }

        long coreSeatId = toCoreSeatId(seatId);
        if (coreSeatId > 0) {
            try {
                ResponseEntity<CoreSeatResponse> response = restTemplate.getForEntity(
                        coreServiceUrl + "/seats/" + coreSeatId,
                        CoreSeatResponse.class
                );
                if (response != null && response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    CoreSeatResponse body = response.getBody();
                    if (body.getRowLabel() != null && body.getSeatNumber() != null) {
                        return body.getRowLabel() + body.getSeatNumber();
                    }
                    if (body.getSeatNumber() != null) {
                        return body.getSeatNumber();
                    }
                }
            } catch (Exception e) {
                log.debug("Could not fetch seat from core-service: {}", e.getMessage());
            }
        }

        // Fallback: generate a readable seat number from UUID
        String uuidStr = seatId.toString();
        // Take last 4 characters and remove non-digits
        String lastPart = uuidStr.substring(Math.max(0, uuidStr.length() - 4));
        String numericPart = lastPart.replaceAll("[^0-9]", "");
        if (numericPart.isEmpty()) {
            numericPart = String.valueOf(Math.abs(seatId.hashCode() % 20 + 1));
        }
        return "A" + numericPart;
    }

    /**
     * Calculates total price based on number of seats
     */
    private BigDecimal calculateTotalPrice(int seatCount) {
        if (seatCount <= 0) {
            return BigDecimal.ZERO;
        }
        // Default price per seat is $15.00
        return BigDecimal.valueOf(seatCount * 15.00).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal evaluateSeatPricing(int seatCount, LocalDateTime showTime) {
        if (seatCount <= 0 || showTime == null) {
            return calculateTotalPrice(seatCount);
        }

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("seatCount", seatCount);
            request.put("basePrice", 1500L); // cents per seat
            request.put("showTime", showTime);
            request.put("bookingTime", LocalDateTime.now());
            request.put("currency", "USD");

            String url = supportServiceUrl + "/api/rules/evaluate/price";
            PricingResponse pricingResponse = restTemplate.postForObject(url, request, PricingResponse.class);
            if (pricingResponse != null && pricingResponse.getFinalPrice() != null) {
                return BigDecimal.valueOf(pricingResponse.getFinalPrice())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            log.warn("Failed to evaluate price via support service, falling back to default price: {}", e.getMessage());
        }

        return calculateTotalPrice(seatCount);
    }

    @lombok.Data
    private static class PricingResponse {
        private Long finalPrice;
    }

    private UserHistoryBookingDto enrichHistoryFromDatabaseIfNeeded(UserHistoryBookingDto dto) {
        if (dto == null || dto.getId() == null) {
            return dto;
        }

        boolean missingSeats = dto.getSeats() == null || dto.getSeats().isEmpty();
        boolean missingSnack = dto.getSnackDetails() == null || dto.getSnackDetails().isBlank();

        if (!missingSeats && !missingSnack && dto.getSeatCount() != null && dto.getSeatCount() > 0) {
            return dto;
        }

        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(dto.getId());
            if (bookingOpt.isEmpty()) {
                return dto;
            }
            Booking booking = bookingOpt.get();

            List<String> seatNumbers = getBookingSeats(dto.getId()).stream()
                    .map(BookingSeatDto::getSeatNumber)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (missingSeats && !seatNumbers.isEmpty()) {
                dto.setSeats(seatNumbers.stream()
                        .map(seat -> HistorySeatDto.builder().seatNumber(seat).build())
                        .collect(Collectors.toList()));
            }

            if (dto.getSeatCount() == null || dto.getSeatCount() <= 0) {
                dto.setSeatCount(seatNumbers.size());
            }

            if (missingSnack) {
                dto.setSnackDetails(booking.getSnackDetails());
            }
            if (dto.getSnacksTotal() == null) {
                dto.setSnacksTotal(booking.getSnacksTotal());
            }
            if (dto.getTotalAmount() == null) {
                dto.setTotalAmount(booking.getTotalAmount());
            }
        } catch (Exception e) {
            log.warn("Could not enrich history record {} from DB fallback", dto.getId(), e);
        }

        return dto;
    }

    private UserHistoryBookingDto buildHistoryDtoFromBooking(Booking booking) {
        List<String> seatNumbers = bookingSeatRepository.findByBookingId(booking.getId()).stream()
                .filter(Objects::nonNull)
                .map(BookingSeat::getSeatId)
                .filter(Objects::nonNull)
                .map(this::getSeatNumber)
                .collect(Collectors.toList());

        return UserHistoryBookingDto.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .movieTitle(booking.getMovieTitle())
                .cinemaName(booking.getBranchName())
                .screenNumber(booking.getScreenName())
                .showTime(booking.getShowTime())
                .seats(seatNumbers.stream()
                        .map(seat -> HistorySeatDto.builder().seatNumber(seat).build())
                        .collect(Collectors.toList()))
                .seatCount(seatNumbers.size())
                .snackDetails(booking.getSnackDetails())
                .snacksTotal(booking.getSnacksTotal())
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN")
                .createdAt(booking.getCreatedAt())
                .build();
    }

    // ==================== INNER CLASSES ====================

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ShowDetails {
        private String movieTitle;
        private String branchName;
        private String screenName;
        private LocalDateTime showTime;
    }

    @lombok.Data
    public static class ScreeningDto {
        private Long id;
        private LocalDateTime startTime;
        private MovieDto movie;
        private ScreenDto screen;
    }

    @lombok.Data
    public static class MovieDto {
        private Long id;
        private String title;
    }

    @lombok.Data
    public static class ScreenDto {
        private Long id;
        private String name;
        private BranchDto branch;
    }

    @lombok.Data
    public static class BranchDto {
        private Long id;
        private String name;
    }
}
