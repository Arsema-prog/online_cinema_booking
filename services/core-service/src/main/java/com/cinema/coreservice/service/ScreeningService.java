package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Screening;
import com.cinema.coreservice.model.ScreeningSeat;
import com.cinema.coreservice.model.Seat;
import com.cinema.coreservice.model.enums.SeatStatus;
import com.cinema.coreservice.repository.ScreeningRepository;
import com.cinema.coreservice.repository.ScreeningSeatRepository;
import com.cinema.coreservice.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreeningService {

    private final ScreeningRepository screeningRepository;
    private final SeatRepository seatRepository;
    private final ScreeningSeatRepository screeningSeatRepository;

    public List<Screening> getAllScreenings() {
        return screeningRepository.findAll();
    }

    public Screening getScreeningById(Long id) {
        return screeningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + id));
    }

    public Screening createScreening(Screening screening) {
        validateScreening(screening);

        Screening savedScreening = screeningRepository.save(screening);


        List<Seat> screenSeats = seatRepository.findByScreen(screening.getScreen());
        List<ScreeningSeat> screeningSeats = new ArrayList<>();

        for (Seat seat : screenSeats) {
            ScreeningSeat ss = new ScreeningSeat();
            ss.setScreening(savedScreening);
            ss.setSeat(seat);
            ss.setStatus(SeatStatus.valueOf("AVAILABLE"));
            screeningSeats.add(ss);
        }
        screeningSeatRepository.saveAll(screeningSeats);

        return savedScreening;
    }

    public Screening updateScreening(Long id, Screening updated) {
        Screening screening = getScreeningById(id);
        
        // Temporarily set to new values to validate
        screening.setMovie(updated.getMovie());
        screening.setScreen(updated.getScreen());
        screening.setStartTime(updated.getStartTime());
        screening.setEndTime(updated.getEndTime());
        
        // validateScreening(screening); // Usually we validate except itself. To bypass self-overlap, we just skip it or write a custom query. 
        // We will just do a quick validation
        validateScreeningExcludingSelf(screening, id);
        
        return screeningRepository.save(screening);
    }

    private void validateScreening(Screening screening) {
        validateScreeningExcludingSelf(screening, null);
    }

    private void validateScreeningExcludingSelf(Screening screening, Long excludeId) {
        if (screening.getStartTime() == null || screening.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required.");
        }
        if (!screening.getStartTime().isBefore(screening.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // 30 mins gap
        LocalDateTime startWithGap = screening.getStartTime().minusMinutes(30);
        LocalDateTime endWithGap = screening.getEndTime().plusMinutes(30);

        List<Screening> overlaps = screeningRepository.findOverlappingScreenings(
            screening.getScreen().getId(), startWithGap, endWithGap);

        if (excludeId != null) {
            overlaps.removeIf(s -> s.getId().equals(excludeId));
        }

        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("Screening time overlaps with existing screenings (including 30m gaps).");
        }

        // Check 1-2 screenings per day in same cinema
        // Find branchId from Screen
        Long branchId = screening.getScreen().getBranch().getId();
        LocalDateTime startOfDay = screening.getStartTime().with(LocalTime.MIN);
        LocalDateTime endOfDay = screening.getStartTime().with(LocalTime.MAX);

        long count = screeningRepository.countScreeningsForMovieInBranch(
            branchId, screening.getMovie().getId(), startOfDay, endOfDay);
        
        // If updating an existing one, count includes it if not changed dates, so simple check:
        // Assume maximum 2 screenings per day
        if (excludeId == null && count >= 2) {
            throw new IllegalArgumentException("A movie can only have 1-2 screenings per day in the same cinema.");
        } else if (excludeId != null && count > 2) {
             throw new IllegalArgumentException("A movie can only have 1-2 screenings per day in the same cinema.");
        }
    }

    public void deleteScreening(Long id) {
        if (!screeningRepository.existsById(id)) {
            throw new EntityNotFoundException("Screening not found: " + id);
        }
        screeningRepository.deleteById(id);
    }
}
