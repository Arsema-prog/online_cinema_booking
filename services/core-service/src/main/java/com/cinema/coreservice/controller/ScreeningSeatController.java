package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.ScreeningSeat;
import com.cinema.coreservice.service.ScreeningSeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/screening-seats")
@RequiredArgsConstructor
public class ScreeningSeatController {

    private final ScreeningSeatService screeningSeatService;

    @GetMapping("/screening/{screeningId}")
    public List<ScreeningSeat> getSeatsByScreening(@PathVariable Long screeningId) {
        return screeningSeatService.getSeatsByScreeningId(screeningId);
    }

    @GetMapping("/screening/{screeningId}/seat-uuids")
    public ResponseEntity<Map<Long, String>> getSeatUuids(@PathVariable Long screeningId) {
        List<Object[]> mappings = screeningSeatService.getSeatMappingByScreeningId(screeningId);

        Map<Long, String> seatUuidMap = new HashMap<>();
        for (Object[] mapping : mappings) {
            Long coreSeatId = ((Number) mapping[0]).longValue();
            String bookingSeatUuid = (String) mapping[1];
            seatUuidMap.put(coreSeatId, bookingSeatUuid);
        }

        return ResponseEntity.ok(seatUuidMap);
    }
}