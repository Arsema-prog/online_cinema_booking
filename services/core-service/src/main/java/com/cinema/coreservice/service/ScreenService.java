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
        int rows = screen.getRowsCount();
        int seatsPerRow = screen.getSeatsPerRow();
        
        for (int r = 0; r < rows; r++) {
            String rowLabel = String.valueOf((char) ('A' + (r % 26)));
            for (int s = 1; s <= seatsPerRow; s++) {
                Seat seat = new Seat();
                seat.setScreen(savedScreen);
                seat.setRowLabel(rowLabel);
                seat.setSeatNumber(rowLabel + s);
                seat.setIsAvailable(true);
                seat.setSeatType("NORMAL");
                seats.add(seat);
            }
        }
        
        seatRepository.saveAll(seats);
        savedScreen.setSeats(seats);

        return savedScreen;
    }

    public Screen updateScreen(Long id, Screen updated) {
        Screen screen = getScreenById(id);
        screen.setName(updated.getName());
        screen.setRowsCount(updated.getRowsCount());
        screen.setSeatsPerRow(updated.getSeatsPerRow());
        screen.setBranch(updated.getBranch());
        screen.setScreenNumber(updated.getScreenNumber());
        screen.setCapacity(updated.getCapacity());
        screen.setIsActive(updated.getIsActive() != null ? updated.getIsActive() : true);
        return screenRepository.save(screen);
    }

    public void deleteScreen(Long id) {
        if (!screenRepository.existsById(id)) {
            throw new EntityNotFoundException("Screen not found: " + id);
        }
        screenRepository.deleteById(id);
    }
}
