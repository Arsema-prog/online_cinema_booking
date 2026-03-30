package com.cinema.booking_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String PAYMENT_SUCCESS_QUEUE = "payment.success.queue";
    public static final String PAYMENT_FAILED_QUEUE = "payment.failed.queue";

    // SEAT STATUS
    public static final String SEAT_STATUS_QUEUE = "seat.status.queue";
    public static final String SEAT_STATUS_ROUTING_KEY = "seat.status";

    // BOOKING CONFIRMED - Add these
    public static final String BOOKING_CONFIRMED_QUEUE = "booking.confirmed.queue";
    public static final String BOOKING_CONFIRMED_ROUTING_KEY = "booking.confirmed";

    @Bean
    public TopicExchange bookingExchange() {
        return new TopicExchange(BOOKING_EXCHANGE);
    }

    @Bean
    public Queue paymentSuccessQueue() {
        return new Queue(PAYMENT_SUCCESS_QUEUE);
    }

    @Bean
    public Binding paymentSuccessBinding() {
        return BindingBuilder
                .bind(paymentSuccessQueue())
                .to(paymentExchange())
                .with("payment.succeeded");
    }

    @Bean
    public Queue paymentFailedQueue() {
        return new Queue(PAYMENT_FAILED_QUEUE);
    }

    @Bean
    public Binding paymentFailedBinding() {
        return BindingBuilder
                .bind(paymentFailedQueue())
                .to(paymentExchange())
                .with("payment.failed");
    }

    @Bean
    public Queue seatStatusQueue() {
        return new Queue(SEAT_STATUS_QUEUE);
    }

    @Bean
    public Binding seatStatusBinding() {
        return BindingBuilder
                .bind(seatStatusQueue())
                .to(bookingExchange())
                .with(SEAT_STATUS_ROUTING_KEY);
    }

    // Add these new beans for booking confirmed
    @Bean
    public Queue bookingConfirmedQueue() {
        return new Queue(BOOKING_CONFIRMED_QUEUE);
    }

    @Bean
    public Binding bookingConfirmedBinding() {
        return BindingBuilder
                .bind(bookingConfirmedQueue())
                .to(bookingExchange())
                .with(BOOKING_CONFIRMED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(PAYMENT_EXCHANGE);
    }
}
