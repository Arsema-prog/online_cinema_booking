package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Screen;
import com.cinema.coreservice.repository.ScreenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/screens")
public class ScreenController {

    @Autowired
    private ScreenRepository screenRepository;

    @GetMapping
    public List<Screen> getAllScreens() {
        return screenRepository.findAll();
    }

    @GetMapping("/{id}")
    public Screen getScreenById(@PathVariable Long id) {
        return screenRepository.findById(id).orElse(null);
    }

    @GetMapping("/branch/{branchId}")
    public List<Screen> getScreensByBranch(@PathVariable Long branchId) {
        return screenRepository.findByBranchId(branchId);
    }

    @PostMapping
    public Screen createScreen(@RequestBody Screen screen) {
        return screenRepository.save(screen);
    }

    @PutMapping("/{id}")
    public Screen updateScreen(@PathVariable Long id, @RequestBody Screen screenDetails) {
        Screen screen = screenRepository.findById(id).orElseThrow();
        screen.setName(screenDetails.getName());
        screen.setBranch(screenDetails.getBranch());
        return screenRepository.save(screen);
    }

    @DeleteMapping("/{id}")
    public void deleteScreen(@PathVariable Long id) {
        screenRepository.deleteById(id);
    }
}

