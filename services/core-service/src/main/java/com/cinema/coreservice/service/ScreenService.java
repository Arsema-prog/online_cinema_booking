package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Screen;
import com.cinema.coreservice.model.Seat;
import com.cinema.coreservice.repository.ScreenRepository;
import com.cinema.coreservice.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreenService {

    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;

    public List<Screen> getAllScreens() {
        return screenRepository.findAll();
    }

    public Screen getScreenById(Long id) {
        return screenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + id));
    }

    public Screen createScreen(Screen screen, int numberOfSeats) {

        Screen savedScreen = screenRepository.save(screen);

        List<Seat> seats = new ArrayList<>();
        for (int i = 1; i <= numberOfSeats; i++) {
            Seat seat = new Seat();
            seat.setScreen(savedScreen);
            seat.setSeatNumber("S" + i);
            seats.add(seat);
        }
        seatRepository.saveAll(seats);
        savedScreen.setSeats(seats);

        return savedScreen;
    }

    public Screen updateScreen(Long id, Screen updated) {
        Screen screen = getScreenById(id);
        screen.setName(updated.getName());
        screen.setRows(updated.getRows());
        screen.setSeatsPerRow(updated.getSeatsPerRow());
        screen.setBranch(updated.getBranch());
        return screenRepository.save(screen);
    }

    public void deleteScreen(Long id) {
        if (!screenRepository.existsById(id)) {
            throw new EntityNotFoundException("Screen not found: " + id);
        }
        screenRepository.deleteById(id);
    }
}
