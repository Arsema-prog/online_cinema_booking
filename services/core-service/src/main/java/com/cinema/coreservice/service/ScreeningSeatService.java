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
            if (Boolean.TRUE.equals(seat.getIsBooked())) {
                throw new IllegalStateException("Seat " + seat.getSeat().getSeatNumber() + " is already booked or held");
            }
            seat.setIsBooked(true);
            seat.setStatus(SeatStatus.HELD.name());
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
            seat.setIsBooked(true);
            seat.setStatus(SeatStatus.RESERVED.name());
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

        if (Boolean.TRUE.equals(seat.getIsBooked())) {
            seat.setIsBooked(false);
            seat.setStatus(SeatStatus.AVAILABLE.name());
            seat.getSeat().setIsAvailable(true);
            screeningSeatRepository.save(seat);
            updateScreeningAvailableSeats(seat.getScreening().getId());
        }
    }

    @Transactional
    public void cancelReservation(Long seatId) {
        ScreeningSeat seat = screeningSeatRepository.findById(seatId)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + seatId));

        if (Boolean.TRUE.equals(seat.getIsBooked())) {
            seat.setIsBooked(false);
            seat.setStatus(SeatStatus.AVAILABLE.name());
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

        List<ScreeningSeat> seats = screeningSeatRepository.findByScreeningIdAndSeatIdIn(
                screeningId, seatIds);

        log.info("Found {} seats to update", seats.size());

        for (ScreeningSeat seat : seats) {
            Boolean oldStatus = seat.getIsBooked();
            Boolean newIsBooked = (status == SeatStatus.HELD || status == SeatStatus.RESERVED);
            seat.setIsBooked(newIsBooked);
            seat.setStatus(status.name());
            log.info("Updated seat {} from {} to {}", seat.getSeat().getSeatNumber(), oldStatus, newIsBooked);

            seat.getSeat().setIsAvailable(!newIsBooked);
        }

        screeningSeatRepository.saveAll(seats);
        updateScreeningAvailableSeats(screeningId);
    }

    @Transactional
    public void recalculateAllScreeningAvailableSeats() {
        List<Screening> allScreenings = screeningRepository.findAll();
        log.info("Recalculating available seats for {} screenings", allScreenings.size());

        for (Screening screening : allScreenings) {
            long availableCount = screeningSeatRepository.countByScreeningIdAndIsBooked(
                    screening.getId(), false);

            int oldCount = screening.getAvailableSeats();
            screening.setAvailableSeats((int) availableCount);
            screeningRepository.save(screening);

            log.info("Screening {}: {} -> {} available seats",
                    screening.getId(), oldCount, availableCount);
        }
    }

    private void updateScreeningAvailableSeats(Long screeningId) {
        log.info("Updating available seats for screening: {}", screeningId);

        long availableCount = screeningSeatRepository.countByScreeningIdAndIsBooked(
                screeningId, false);

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

        // If all strategies fail, throw a clearer exception
        throw new IllegalArgumentException("Cannot extract numeric screening id from show UUID: " + uuidStr);
    }

    public long countSeatsByIsBooked(Long screeningId, Boolean isBooked) {
        return screeningSeatRepository.countByScreeningIdAndIsBooked(screeningId, isBooked);
    }
}
