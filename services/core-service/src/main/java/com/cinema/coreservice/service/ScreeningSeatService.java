package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Screening;
import com.cinema.coreservice.model.ScreeningSeat;
import com.cinema.coreservice.model.enums.SeatStatus;
import com.cinema.coreservice.repository.ScreeningRepository;
import com.cinema.coreservice.repository.ScreeningSeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScreeningSeatService {

    private final ScreeningSeatRepository screeningSeatRepository;
    private final ScreeningRepository screeningRepository;

    public List<ScreeningSeat> getSeatsByScreeningId(Long screeningId) {
        return screeningSeatRepository.findByScreeningIdOrderBySeatRowLabelSeatNumber(screeningId);
    }

    public List<Object[]> getSeatMappingByScreeningId(Long screeningId) {
        List<Object[]> result = new ArrayList<>();

        List<ScreeningSeat> screeningSeats = screeningSeatRepository.findByScreeningId(screeningId);

        for (ScreeningSeat screeningSeat : screeningSeats) {
            Long coreSeatId = screeningSeat.getSeat().getId();
            // Generate an explicit UUID so booking-service XOR extraction results directly in the coreSeatId
            String bookingSeatUuid = new UUID(0L, coreSeatId).toString();
            result.add(new Object[]{coreSeatId, bookingSeatUuid});
        }

        return result;
    }

    public List<Object[]> getSeatMapping(UUID showId) {
        Long screeningId = findScreeningIdByUuid(showId);
        return getSeatMappingByScreeningId(screeningId);
    }

    private String generateBookingSeatUuid(UUID showId, Long coreSeatId) {
        return new UUID(0L, coreSeatId).toString();
    }

    @Transactional
    public List<ScreeningSeat> holdSeats(Long screeningId, List<Long> seatIds) {
        List<ScreeningSeat> seats = screeningSeatRepository.findByScreeningIdAndSeatIdIn(screeningId, seatIds);

        for (ScreeningSeat seat : seats) {
            if (seat.getStatus() != SeatStatus.AVAILABLE) {
                throw new IllegalStateException("Seat " + seat.getSeat().getSeatNumber() + " is not available (current status: " + seat.getStatus() + ")");
            }
            seat.setStatus(SeatStatus.HELD);
            seat.getSeat().setIsAvailable(false);
        }

        List<ScreeningSeat> updatedSeats = screeningSeatRepository.saveAll(seats);
        updateScreeningAvailableSeats(screeningId);

        return updatedSeats;
    }

    @Transactional
    public List<ScreeningSeat> reserveSeats(Long screeningId, List<Long> seatIds) {
        List<ScreeningSeat> seats = screeningSeatRepository.findByScreeningIdAndSeatIdIn(screeningId, seatIds);

        for (ScreeningSeat seat : seats) {
            if (seat.getStatus() != SeatStatus.HELD && seat.getStatus() != SeatStatus.AVAILABLE) {
                throw new IllegalStateException("Seat " + seat.getSeat().getSeatNumber() + " cannot be reserved");
            }
            seat.setStatus(SeatStatus.RESERVED);
            seat.getSeat().setIsAvailable(false);
        }

        List<ScreeningSeat> updatedSeats = screeningSeatRepository.saveAll(seats);
        updateScreeningAvailableSeats(screeningId);

        return updatedSeats;
    }

    @Transactional
    public List<ScreeningSeat> bookSeats(Long screeningId, List<Long> seatIds) {
        return reserveSeats(screeningId, seatIds);
    }

    @Transactional
    public void releaseHold(Long seatId) {
        ScreeningSeat seat = screeningSeatRepository.findById(seatId)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + seatId));

        if (seat.getStatus() == SeatStatus.HELD) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.getSeat().setIsAvailable(true);
            screeningSeatRepository.save(seat);
            updateScreeningAvailableSeats(seat.getScreening().getId());
        }
    }

    @Transactional
    public void cancelReservation(Long seatId) {
        ScreeningSeat seat = screeningSeatRepository.findById(seatId)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + seatId));

        if (seat.getStatus() == SeatStatus.RESERVED) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.getSeat().setIsAvailable(true);
            screeningSeatRepository.save(seat);
            updateScreeningAvailableSeats(seat.getScreening().getId());
        }
    }

    @Transactional
    public void updateSeatStatusFromEvent(UUID showUuid, List<Long> seatIds, SeatStatus status, UUID bookingId) {
        log.info("Updating seat status from event: showId={}, seats={}, status={}",
                showUuid, seatIds, status);

        Long screeningId = findScreeningIdByUuid(showUuid);
        log.info("Mapped to screening ID: {}", screeningId);

        for (Long seatId : seatIds) {
            // Find by screening_id and seat_id
            Optional<ScreeningSeat> seatOpt = screeningSeatRepository.findByScreeningIdAndSeatId(screeningId, seatId);

            if (seatOpt.isPresent()) {
                ScreeningSeat seat = seatOpt.get();
                SeatStatus oldStatus = seat.getStatus();
                seat.setStatus(status);
                log.info("Updated seat {} from {} to {}", seatId, oldStatus, status);

                if (status == SeatStatus.HELD || status == SeatStatus.RESERVED) {
                    seat.getSeat().setIsAvailable(false);
                } else if (status == SeatStatus.AVAILABLE) {
                    seat.getSeat().setIsAvailable(true);
                }

                screeningSeatRepository.save(seat);
            } else {
                log.warn("Seat {} not found for screening {}", seatId, screeningId);
            }
        }

        updateScreeningAvailableSeats(screeningId);
    }

    @Transactional
    public void recalculateAllScreeningAvailableSeats() {
        List<Screening> allScreenings = screeningRepository.findAll();
        log.info("Recalculating available seats for {} screenings", allScreenings.size());

        for (Screening screening : allScreenings) {
            long availableCount = screeningSeatRepository.countByScreeningIdAndStatus(
                    screening.getId(), SeatStatus.AVAILABLE);

            int oldCount = screening.getAvailableSeats();
            screening.setAvailableSeats((int) availableCount);
            screeningRepository.save(screening);

            log.info("Screening {}: {} -> {} available seats",
                    screening.getId(), oldCount, availableCount);
        }
    }

    private void updateScreeningAvailableSeats(Long screeningId) {
        log.info("Updating available seats for screening: {}", screeningId);

        long availableCount = screeningSeatRepository.countByScreeningIdAndStatus(
                screeningId, SeatStatus.AVAILABLE);

        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + screeningId));

        // Handle null values safely
        int oldCount = screening.getAvailableSeats() != null ? screening.getAvailableSeats() : 0;
        screening.setAvailableSeats((int) availableCount);

        // Also set total_seats if null
        if (screening.getTotalSeats() == null) {
            long totalCount = screeningSeatRepository.countByScreeningId(screeningId);
            screening.setTotalSeats((int) totalCount);
        }

        screeningRepository.save(screening);

        log.info("Updated screening {} available seats from {} to {}",
                screeningId, oldCount, availableCount);
    }
    private Long findScreeningIdByUuid(UUID showUuid) {
        String uuidStr = showUuid.toString();
        log.debug("Extracting screening ID from UUID: {}", uuidStr);

        // Try to extract numeric part from the UUID
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        // The last group is what we want for screening ID

        String[] parts = uuidStr.split("-");
        if (parts.length >= 5) {
            String lastPart = parts[4];
            // Remove leading zeros
            String numericPart = lastPart.replaceFirst("^0+(?!$)", "");
            if (numericPart.isEmpty()) {
                numericPart = "0";
            }
            try {
                return Long.parseLong(numericPart);
            } catch (NumberFormatException e) {
                log.warn("Failed to parse numeric part: {}", numericPart);
            }
        }

        // If that fails, try to extract digits from the entire UUID
        String digitsOnly = uuidStr.replaceAll("[^0-9]", "");
        if (!digitsOnly.isEmpty()) {
            try {
                // Take the first few digits that might represent the screening ID
                return Long.parseLong(digitsOnly.substring(0, Math.min(5, digitsOnly.length())));
            } catch (NumberFormatException e) {
                log.warn("Failed to parse digits: {}", digitsOnly);
            }
        }

        log.error("Failed to extract screening ID from UUID: {}", showUuid);
        throw new RuntimeException("Invalid screening UUID format: " + showUuid);
    }
    public long countSeatsByStatus(Long screeningId, SeatStatus status) {
        return screeningSeatRepository.countByScreeningIdAndStatus(screeningId, status);
    }
}