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
import java.util.List;
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
        updateScreeningAvailableSeats(screeningId); // Make sure this is called

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
        updateScreeningAvailableSeats(screeningId); // Make sure this is called

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
            updateScreeningAvailableSeats(seat.getScreening().getId()); // Make sure this is called
        }
    }

    @Transactional
    public void cancelReservation(Long seatId) {
        ScreeningSeat seat = screeningSeatRepository.findById(seatId)
                .orElseThrow(() -> new EntityNotFoundException("Seat not found: " + seatId));

        if (seat.getStatus() == SeatStatus.RESERVED) {
            seat.setStatus(SeatStatus.AVAILABLE); // Changed from CANCELLED to AVAILABLE
            seat.getSeat().setIsAvailable(true);
            screeningSeatRepository.save(seat);
            updateScreeningAvailableSeats(seat.getScreening().getId()); // Make sure this is called
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
            SeatStatus oldStatus = seat.getStatus();
            seat.setStatus(status);
            log.info("Updated seat {} from {} to {}", seat.getSeat().getSeatNumber(), oldStatus, status);

            if (status == SeatStatus.HELD || status == SeatStatus.RESERVED) {
                seat.getSeat().setIsAvailable(false);
            } else if (status == SeatStatus.AVAILABLE) {
                seat.getSeat().setIsAvailable(true);
            }
        }

        screeningSeatRepository.saveAll(seats);
        updateScreeningAvailableSeats(screeningId); // Make sure this is called
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

        int oldCount = screening.getAvailableSeats();
        screening.setAvailableSeats((int) availableCount);
        screeningRepository.save(screening);

        log.info("Updated screening {} available seats from {} to {}",
                screeningId, oldCount, availableCount);
    }

    private Long findScreeningIdByUuid(UUID showUuid) {
        String uuidStr = showUuid.toString();
        String lastPart = uuidStr.substring(uuidStr.lastIndexOf('-') + 1);
        String numericPart = lastPart.replaceFirst("^0+(?!$)", "");
        if (numericPart.isEmpty()) {
            numericPart = "0";
        }
        try {
            return Long.parseLong(numericPart);
        } catch (NumberFormatException e) {
            log.error("Failed to extract screening ID from UUID: {}", showUuid);
            throw new RuntimeException("Invalid screening UUID format: " + showUuid);
        }
    }

    public long countSeatsByStatus(Long screeningId, SeatStatus status) {
        return screeningSeatRepository.countByScreeningIdAndStatus(screeningId, status);
    }
}