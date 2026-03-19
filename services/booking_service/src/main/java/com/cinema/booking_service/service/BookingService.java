package com.cinema.booking_service.service;

import java.util.Optional;
import com.cinema.booking_service.domain.*;
import com.cinema.booking_service.domain.enums.BookingStatus;
import com.cinema.booking_service.domain.enums.SeatHoldStatus;
import com.cinema.booking_service.dto.BookingConfirmedEvent;
import com.cinema.booking_service.dto.BookingDTO;
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
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;

    @Value("${core.service.url:http://localhost:8081}")
    private String coreServiceUrl;

    private static final int HOLD_TTL_MINUTES = 15;

    private List<UUID> getAllSeatsForShow(UUID showId) {
        return seatRepository.findByShowId(showId).stream()
                .map(Seat::getId)
                .collect(Collectors.toList());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public HoldResponse holdSeats(HoldRequest request) {
        log.info("Holding seats for show: {}, seats: {}", request.getShowId(), request.getSeatIds());

        // 1️⃣ Check if requested seats are already held or booked
        for (UUID seatId : request.getSeatIds()) {
            List<SeatHold> existingHolds = seatHoldRepository
                    .findByShowIdAndSeatIdAndStatus(request.getShowId(), seatId, SeatHoldStatus.ACTIVE);
            if (!existingHolds.isEmpty()) {
                throw new RuntimeException("Seat " + seatId + " is already held or booked.");
            }
        }

        // 2️⃣ Fetch show details from core service (with fallback)
        ShowDetails showDetails = fetchShowDetails(request.getShowId());

        // 3️⃣ Create booking with all details
        // 3️⃣ Create booking with all details - DON'T set the ID manually
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
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(HOLD_TTL_MINUTES);
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

        // 6️⃣ Build response
        HoldResponse response = HoldResponse.builder()
                .bookingId(bookingId)
                .status(savedBooking.getStatus().toString())
                .heldSeatIds(request.getSeatIds())
                .expiresAt(expiresAt)
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
    }


    @Transactional(readOnly = true)
    public List<SeatAvailability> getAvailableSeats(UUID showId) {

        // 1️⃣ Get all active holds
        List<SeatHold> activeHolds = seatHoldRepository.findByShowIdAndStatus(showId, SeatHoldStatus.ACTIVE);

        Set<UUID> heldSeatIds = activeHolds.stream()
                .map(SeatHold::getSeatId)
                .collect(Collectors.toSet());

        // 2️⃣ Get all booked seats
        List<BookingSeat> bookedSeats = bookingSeatRepository.findByShowId(showId);
        Set<UUID> bookedSeatIds = bookedSeats.stream()
                .map(BookingSeat::getSeatId)
                .collect(Collectors.toSet());

        // 3️⃣ Construct response
        List<UUID> allSeats = getAllSeatsForShow(showId);
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
        // For now, use a default email
        String defaultEmail = "arsematesfaye019@gmail.com";
        confirmBooking(bookingId, defaultEmail);
    }
    @Transactional
    public void confirmBooking(UUID bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        // Update Booking status
        booking.setStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);
        log.info("Updated booking status to CONFIRMED: {}", bookingId);

        // Update BookingSeat status
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            seat.setStatus(BookingStatus.CONFIRMED);
        }
        bookingSeatRepository.saveAll(seats);

        // Update SeatHold status
        List<SeatHold> holds = seatHoldRepository.findByBookingIdAndStatus(bookingId, SeatHoldStatus.ACTIVE);
        for (SeatHold hold : holds) {
            hold.setStatus(SeatHoldStatus.EXPIRED);
        }
        seatHoldRepository.saveAll(holds);

        // Use the userEmail parameter directly - NO need to redeclare it
        publishBookingConfirmedEvent(booking, seats, userEmail);

        // Get details for core service event
        UUID showId = booking.getShowId();
        List<Long> numericSeatIds = getSeatIdsFromBooking(bookingId);
        String userId = booking.getUserId().toString();

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
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Cancel seats
        List<BookingSeat> seats = bookingSeatRepository.findByBookingId(bookingId);
        for (BookingSeat seat : seats) {
            seat.setStatus(BookingStatus.CANCELLED);
        }
        bookingSeatRepository.saveAll(seats);

        // Get details for event publishing
        UUID showId = booking.getShowId();
        List<Long> numericSeatIds = getSeatIdsFromBooking(bookingId);
        String userId = booking.getUserId().toString();

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
        return bookingRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUserId(userId);
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
        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .showId(booking.getShowId())
                .status(booking.getStatus().toString())
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
        dto.setSeatCount(seatCount);
        return dto;
    }

    @Scheduled(fixedRate = 60000) // every 1 minute
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

    // ==================== HELPER METHODS ====================

    /**
     * Fetches show details from core service
     */
    private ShowDetails fetchShowDetails(UUID showId) {
        try {
            Long numericId = extractNumericIdFromUuid(showId);
            String url = coreServiceUrl + "/screenings/" + numericId;
            log.info("Fetching show details from: {}", url);

            ResponseEntity<ScreeningDto> response = restTemplate.getForEntity(url, ScreeningDto.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                ScreeningDto screening = response.getBody();
                return ShowDetails.builder()
                        .movieTitle(screening.getMovie().getTitle())
                        .branchName(screening.getScreen().getBranch().getName())
                        .screenName(screening.getScreen().getName())
                        .showTime(screening.getStartTime())
                        .build();
            } else {
                throw new RuntimeException("Failed to fetch screening details");
            }
        } catch (Exception e) {
            log.error("Failed to fetch show details for showId: {}", showId, e);
            // Return default values for testing
            Long numericId = extractNumericIdFromUuid(showId);
            return ShowDetails.builder()
                    .movieTitle("Movie " + numericId)
                    .branchName("Main Branch")
                    .screenName("Screen 1")
                    .showTime(LocalDateTime.now().plusDays(1))
                    .build();
        }
    }
    /**
     * Extracts numeric ID from UUID format: 00000000-0000-0000-0000-000000000012 -> 12
     */
    private Long extractNumericIdFromUuid(UUID uuid) {
        String uuidStr = uuid.toString();
        String lastPart = uuidStr.substring(uuidStr.lastIndexOf('-') + 1);
        // Remove leading zeros
        String numericPart = lastPart.replaceFirst("^0+(?!$)", "");
        if (numericPart.isEmpty()) {
            numericPart = "0";
        }
        return Long.parseLong(numericPart);
    }

    /**
     * Publishes booking confirmed event to RabbitMQ for ticket generation
     */
    private void publishBookingConfirmedEvent(Booking booking, List<BookingSeat> seats, String userEmail) {

        // Get seat numbers
        List<String> seatNumbers = seats.stream()
                .map(bs -> getSeatNumber(bs.getSeatId()))
                .collect(Collectors.toList());

        // Create the event object
        BookingConfirmedEvent event = new BookingConfirmedEvent(
                booking.getId(),
                booking.getUserId(),
                userEmail,
                booking.getMovieTitle(),
                booking.getBranchName(),
                booking.getScreenName(),
                booking.getShowTime(),
                seatNumbers,
                booking.getTotalAmount()
        );

        // Publish to RabbitMQ
        rabbitTemplate.convertAndSend(
                BOOKING_EXCHANGE,
                BOOKING_CONFIRMED_ROUTING_KEY,
                event
        );

        log.info("Published booking confirmed event for booking: {}", booking.getId());
    }

    /**
     * Converts UUID seat IDs to numeric IDs for core service
     */
    private List<Long> convertUuidToNumericIds(List<UUID> uuidSeatIds) {
        return uuidSeatIds.stream()
                .map(uuid -> Math.abs(uuid.getLeastSignificantBits() % 10000))
                .collect(Collectors.toList());
    }

    /**
     * Gets seat IDs from booking as numeric values for core service
     */
    private List<Long> getSeatIdsFromBooking(UUID bookingId) {
        List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingId(bookingId);
        return bookingSeats.stream()
                .map(bs -> Math.abs(bs.getSeatId().getLeastSignificantBits() % 10000))
                .collect(Collectors.toList());
    }

    /**
     * Gets seat number from seat ID (placeholder)
     */
    private String getSeatNumber(UUID seatId) {
        // This is a placeholder - you should fetch from seat repository or core service
        return "A" + (Math.abs(seatId.hashCode()) % 15 + 1);
    }

    /**
     * Calculates total price based on number of seats
     */
    private BigDecimal calculateTotalPrice(int seatCount) {
        // This is a placeholder - you should calculate based on actual seat prices
        return BigDecimal.valueOf(seatCount * 15).setScale(2, RoundingMode.HALF_UP);
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