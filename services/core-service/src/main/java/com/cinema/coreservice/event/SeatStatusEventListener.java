// core-service: com/cinema/coreservice/event/SeatStatusEventListener.java
package com.cinema.coreservice.event;

import com.cinema.booking_service.event.SeatStatusEvent;
import com.cinema.coreservice.model.enums.SeatStatus;
import com.cinema.coreservice.service.ScreeningSeatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SeatStatusEventListener {

    private final ScreeningSeatService screeningSeatService;

    public void receiveMessage(SeatStatusEvent event) {
        log.info("📨 Received seat status event: {}", event);

        try {
            switch (event.getEventType()) {
                case "SEAT_HELD":
                    screeningSeatService.updateSeatStatusFromEvent(
                            event.getShowId(),
                            event.getSeatIds(),
                            SeatStatus.HELD,
                            event.getBookingId()
                    );
                    break;

                case "SEAT_RESERVED":
                    screeningSeatService.updateSeatStatusFromEvent(
                            event.getShowId(),
                            event.getSeatIds(),
                            SeatStatus.RESERVED,
                            event.getBookingId()
                    );
                    break;

                case "SEAT_CANCELLED":
                    screeningSeatService.updateSeatStatusFromEvent(
                            event.getShowId(),
                            event.getSeatIds(),
                            SeatStatus.AVAILABLE,
                            event.getBookingId()
                    );
                    break;

                default:
                    log.warn("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Failed to process seat status event", e);
        }
    }
}