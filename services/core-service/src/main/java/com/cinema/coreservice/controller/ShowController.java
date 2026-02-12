package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Show;
import com.cinema.coreservice.repository.ShowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/shows")
public class ShowController {

    @Autowired
    private ShowRepository showRepository;

    @GetMapping
    public List<Show> getAllShows() {
        return showRepository.findAll();
    }

    @GetMapping("/{id}")
    public Show getShowById(@PathVariable Long id) {
        return showRepository.findById(id).orElse(null);
    }

    @GetMapping("/screen/{screenId}")
    public List<Show> getShowsByScreen(@PathVariable Long screenId) {
        return showRepository.findByScreenId(screenId);
    }

    @GetMapping("/between")
    public List<Show> getShowsBetween(@RequestParam String start, @RequestParam String end) {
        LocalDateTime startTime = LocalDateTime.parse(start);
        LocalDateTime endTime = LocalDateTime.parse(end);
        return showRepository.findByStartTimeBetween(startTime, endTime);
    }

    @PostMapping
    public Show createShow(@RequestBody Show show) {
        return showRepository.save(show);
    }

    @PutMapping("/{id}")
    public Show updateShow(@PathVariable Long id, @RequestBody Show showDetails) {
        Show show = showRepository.findById(id).orElseThrow();
        show.setMovie(showDetails.getMovie());
        show.setScreen(showDetails.getScreen());
        show.setStartTime(showDetails.getStartTime());
        show.setBasePrice(showDetails.getBasePrice());
        return showRepository.save(show);
    }

    @DeleteMapping("/{id}")
    public void deleteShow(@PathVariable Long id) {
        showRepository.deleteById(id);
    }
}
