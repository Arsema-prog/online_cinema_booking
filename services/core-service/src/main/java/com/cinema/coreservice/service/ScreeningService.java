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
        screening.setMovie(updated.getMovie());
        screening.setScreen(updated.getScreen());
        screening.setStartTime(updated.getStartTime());
        screening.setEndTime(updated.getEndTime());
        return screeningRepository.save(screening);
    }

    public void deleteScreening(Long id) {
        if (!screeningRepository.existsById(id)) {
            throw new EntityNotFoundException("Screening not found: " + id);
        }
        screeningRepository.deleteById(id);
    }
}
