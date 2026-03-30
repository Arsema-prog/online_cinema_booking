package com.cinema.booking_service.messaging;

import com.cinema.booking_service.config.RabbitConfig;
import com.cinema.booking_service.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final BookingService bookingService;

    @RabbitListener(queues = RabbitConfig.PAYMENT_SUCCESS_QUEUE)
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        bookingService.confirmBooking(event.getBookingId());
    }

    @RabbitListener(queues = RabbitConfig.PAYMENT_FAILED_QUEUE)
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.warn("Received payment failure for booking {}. Reason: {}", event.getBookingId(), event.getReason());
        bookingService.failBooking(event.getBookingId());
    }
}
