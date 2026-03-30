package com.cinema.booking_service.service;

import com.cinema.booking_service.model.SeatAvailability;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastSeatUpdate(UUID showId, SeatAvailability seatAvailability) {
        String destination = "/topic/shows/" + showId + "/seats";
        log.info("Broadcasting seat update: {} to {}", seatAvailability, destination);
        messagingTemplate.convertAndSend(destination, seatAvailability);
    }
}
