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
import java.util.concurrent.ConcurrentHashMap;
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
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;
    private final UserHistoryStorageService userHistoryStorageService;

    @Value("${core.service.url:http://localhost:8081}")
    private String coreServiceUrl;

    private static final int HOLD_TTL_SECONDS = 120;

    // Map to hold thread locks per show to prevent concurrent double-booking
    private final ConcurrentHashMap<UUID, Object> showLocks = new ConcurrentHashMap<>();

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
                    return new BookingSeatDto("UNKNOWN", "?", 0);
                })
                .collect(Collectors.toList());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public HoldResponse holdSeats(HoldRequest request) {
        if (request == null || request.getShowId() == null || request.getSeatIds() == null || request.getUserId() == null) {
            throw new IllegalArgumentException("Invalid hold request: missing required fields");
        }

        log.info("Holding seats for show: {}, seats: {}", request.getShowId(), request.getSeatIds());

        // Get or create a lock for this specific show
        Object showLock = showLocks.computeIfAbsent(request.getShowId(), k -> new Object());

        // Thread-safe block to prevent simultaneous double-booking of the same seats
        synchronized (showLock) {
            // 1️⃣ Check if requested seats are already held or booked
            for (UUID seatId : request.getSeatIds()) {
                List<SeatHold> existingHolds = seatHoldRepository
                        .findByShowIdAndSeatIdAndStatusAndExpiresAtAfter(
                                request.getShowId(),
                                seatId,
                                SeatHoldStatus.ACTIVE,
                                LocalDateTime.now()
                        );
                if (!existingHolds.isEmpty()) {
                    throw new RuntimeException("Seat " + seatId + " is already held or booked.");
                }
            }

            // 2️⃣ Fetch show details from core service (with fallback)
            ShowDetails showDetails = fetchShowDetails(request.getShowId());

            // 3️⃣ Create booking with all details
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
                    .totalAmount(calculateTotalPrice(request.getSeatIds().size()))
                    .build();

            // Let the database generate the ID
            Booking savedBooking = bookingRepository.save(booking);
            UUID bookingId = savedBooking.getId();
            log.info("Created booking with ID: {}", bookingId);

            // 4️⃣ Create seat holds
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(HOLD_TTL_SECONDS);
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

            seatHoldRepository.saveAll(seatHolds);
            log.info("Created {} seat holds", seatHolds.size());

            // 5️⃣ Create booking seats
            List<BookingSeat> bookingSeats = request.getSeatIds().stream()
                    .map(seatId -> BookingSeat.builder()
                            .id(UUID.randomUUID())
                            .bookingId(bookingId)
                            .showId(request.getShowId())
                            .seatId(seatId)
                            .status(BookingStatus.SEATS_HELD)
                            .build())
                    .collect(Collectors.toList());

            bookingSeatRepository.saveAll(bookingSeats);
            log.info("Created {} booking seats", bookingSeats.size());

            // Broadcast WebSocket updates
            for (UUID seatId : request.getSeatIds()) {
                webSocketService.broadcastSeatUpdate(
                    request.getShowId(), 
                    SeatAvailability.builder().seatId(seatId).status("HELD").build()
                );
            }

            // 6️⃣ Build response
            HoldResponse response = HoldResponse.builder()
                    .bookingId(bookingId)
                    .status(savedBooking.getStatus().toString())
                    .heldSeatIds(request.getSeatIds())
                    .expiresAt(expiresAt)
                    .expiresAtEpochMs(expiresAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
                    .build();

            // 7️⃣ Convert UUIDs to numeric IDs for core service
            List<Long> numericSeatIds = convertUuidToNumericIds(request.getSeatIds());

            // 8️⃣ Publish seat held event to RabbitMQ
            try {
                eventPublisher.publishSeatHeldEvent(
                        request.getShowId(),
                        numericSeatIds,
                        response.getBookingId(),
                        request.getUserId().toString()
                );
                log.info("Published seat held event");
            } catch (Exception e) {
                log.error("Failed to publish seat held event", e);
                // Don't fail the transaction
            }

            return response;
        } // end synchronized block
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

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (booking.getUserId() == null) {
            log.warn("Booking {} has null userId", bookingId);
        }

        // Update Booking status
        booking.setStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);
        log.info("Updated booking status to CONFIRMED: {}", bookingId);

        try {
            eventPublisher.publishSeatReservedEvent(
                    booking.getShowId(),
                    getSeatIdsFromBooking(bookingId),
                    bookingId,
                    booking.getUserId().toString()
            );
            log.info("Published seat reserved event for booking: {}", bookingId);
        } catch (Exception e) {
            log.error("Failed to publish seat reserved event", e);
        }
        // Update BookingSeat status
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            if (seat != null) {
                seat.setStatus(BookingStatus.CONFIRMED);
            }
        }
        bookingSeatRepository.saveAll(seats);

        // Update SeatHold status
        List<SeatHold> holds = seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE);
        for (SeatHold hold : holds) {
            if (hold != null) {
                hold.setStatus(SeatHoldStatus.EXPIRED);
            }
        }
        seatHoldRepository.saveAll(holds);

        // Broadcast WebSocket updates
        for (BookingSeat seat : seats) {
            if (seat != null && seat.getSeatId() != null) {
                webSocketService.broadcastSeatUpdate(
                    booking.getShowId(),
                    SeatAvailability.builder().seatId(seat.getSeatId()).status("BOOKED").build()
                );
            }
        }

        // Publish booking confirmed event
        publishBookingConfirmedEvent(booking, seats, normalizedUserEmail);

        // Persist user booking history to MinIO for "My Profile / View Bookings"
        List<String> seatNumbers = seats.stream()
                .filter(Objects::nonNull)
                .map(BookingSeat::getSeatId)
                .map(this::getSeatNumber)
                .collect(Collectors.toList());
        userHistoryStorageService.saveConfirmedBooking(booking, seatNumbers);

        // Get details for core service event
        UUID showId = booking.getShowId();
        List<Long> numericSeatIds = getSeatIdsFromBooking(bookingId);
        String userId = booking.getUserId() != null ? booking.getUserId().toString() : "unknown";

        // Publish seat reserved event to core service
        try {
            eventPublisher.publishSeatReservedEvent(
                    showId,
                    numericSeatIds,
                    bookingId,
                    userId
            );
            log.info("Published seat reserved event");
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

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Cancel seats
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            if (seat != null) {
                seat.setStatus(BookingStatus.CANCELLED);
            }
        }
        bookingSeatRepository.saveAll(seats);

        // Get details for event publishing
        UUID showId = booking.getShowId();
        List<Long> numericSeatIds = getSeatIdsFromBooking(bookingId);
        String userId = booking.getUserId() != null ? booking.getUserId().toString() : "unknown";

        // Broadcast WebSocket updates
        for (BookingSeat seat : seats) {
            if (seat != null && seat.getSeatId() != null) {
                webSocketService.broadcastSeatUpdate(
                    showId,
                    SeatAvailability.builder().seatId(seat.getSeatId()).status("AVAILABLE").build()
                );
            }
        }

        // Remove holds
        seatHoldRepository.deleteByBookingId(bookingId);

        // Publish seat cancelled event
        try {
            eventPublisher.publishSeatCancelledEvent(
                    showId,
                    numericSeatIds,
                    bookingId,
                    userId
            );
            log.info("Published seat cancelled event");
        } catch (Exception e) {
            log.error("Failed to publish seat cancelled event", e);
        }

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
        BigDecimal seatsTotal = calculateTotalPrice(seatCount);
        booking.setTotalAmount(seatsTotal.add(booking.getSnacksTotal()));

        booking.setStatus(BookingStatus.SNACKS_SELECTED);
        log.info("Added snacks to booking {}, new total: {}", bookingId, booking.getTotalAmount());
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking initiatePayment(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
                
        if (booking.getStatus() != BookingStatus.SEATS_HELD && booking.getStatus() != BookingStatus.SNACKS_SELECTED) {
            throw new IllegalStateException("Cannot initiate payment from state: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.PAYMENT_INITIATED);
        log.info("Payment initiated for booking {}", bookingId);
        return bookingRepository.save(booking);
    }

    @Transactional
    public void failBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.warn("Ignoring payment failure compensation for already confirmed booking {}", bookingId);
            return;
        }

        // Compensation: release seats and holds
        cancelBooking(bookingId);

        // Mark final saga state as FAILED after compensation succeeds.
        booking.setStatus(BookingStatus.FAILED);
        bookingRepository.save(booking);

        log.info("Booking {} failed. Compensation actions executed.", bookingId);
    }

    @Scheduled(fixedRate = 10000) // every 10 seconds
    @Transactional
    public void expireHolds() {
        List<SeatHold> expiredHolds = seatHoldRepository.findByStatusAndExpiresAtBefore(
                SeatHoldStatus.ACTIVE,
                LocalDateTime.now()
        );

        for (SeatHold hold : expiredHolds) {
            if (hold != null && hold.getBookingId() != null) {
                hold.setStatus(SeatHoldStatus.EXPIRED);
                seatHoldRepository.save(hold);
                
                // Broadcast WebSocket update
                if (hold.getSeatId() != null && hold.getShowId() != null) {
                    webSocketService.broadcastSeatUpdate(
                        hold.getShowId(),
                        SeatAvailability.builder().seatId(hold.getSeatId()).status("AVAILABLE").build()
                    );
                }

                // Optionally cancel booking if all seats are expired
                List<SeatHold> activeHolds = seatHoldRepository.findByBookingIdAndStatus(hold.getBookingId(), SeatHoldStatus.ACTIVE);
                if (activeHolds.isEmpty()) {
                    try {
                        cancelBooking(hold.getBookingId());
                    } catch (Exception e) {
                        log.error("Failed to cancel booking {} during expiration", hold.getBookingId(), e);
                    }
                }
            }
        }

        if (!expiredHolds.isEmpty()) {
            log.info("Expired {} seat holds", expiredHolds.size());
        }
    }

    // ==================== HELPER METHODS ====================

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
     * Extracts numeric ID from UUID format using bit operations
     * This creates a stable numeric identifier from a UUID
     */
    private Long extractNumericIdFromUuid(UUID uuid) {
        if (uuid == null) {
            return 0L;
        }
        // Use XOR of most and least significant bits to generate a numeric ID
        long numericId = uuid.getMostSignificantBits() ^ uuid.getLeastSignificantBits();
        // Ensure it's positive
        return Math.abs(numericId);
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
                .map(uuid -> {
                    // Generate a stable numeric ID from UUID
                    return Math.abs(uuid.getMostSignificantBits() ^ uuid.getLeastSignificantBits());
                })
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
                    // Generate numeric ID from UUID
                    return Math.abs(bs.getSeatId().getMostSignificantBits() ^ bs.getSeatId().getLeastSignificantBits());
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
