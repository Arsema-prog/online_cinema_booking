package com.cinema.booking_service.config;

import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String PAYMENT_SUCCESS_QUEUE = "payment.success.queue";
    public static final String PAYMENT_FAILED_QUEUE = "payment.failed.queue";
    public static final String PAYMENT_SUCCESS_DLQ = "payment.success.queue.dlq";
    public static final String PAYMENT_FAILED_DLQ = "payment.failed.queue.dlq";
    public static final String HOLD_EXPIRED_DLQ = "booking.hold.expired.queue.dlq";
    public static final String DEAD_LETTER_EXCHANGE = "booking.dlx";

    // SEAT STATUS
    public static final String SEAT_STATUS_QUEUE = "seat.status.queue";
    public static final String SEAT_STATUS_ROUTING_KEY = "seat.status";

    // BOOKING CONFIRMED - Add these
    public static final String BOOKING_CONFIRMED_QUEUE = "booking.confirmed.queue";
    public static final String BOOKING_CONFIRMED_ROUTING_KEY = "booking.confirmed";
    public static final String BOOKING_CONFIRMED_DLQ = "booking.confirmed.queue.dlq";
    public static final String HOLD_EXPIRATION_QUEUE = "booking.hold.expiration.queue";
    public static final String HOLD_EXPIRATION_ROUTING_KEY = "booking.hold.expiration";
    public static final String HOLD_EXPIRED_QUEUE = "booking.hold.expired.queue";
    public static final String HOLD_EXPIRED_ROUTING_KEY = "booking.hold.expired";

    @Value("${booking.hold.ttl-millis:120000}")
    private long holdTtlMillis;

    @Bean
    public TopicExchange bookingExchange() {
        return new TopicExchange(BOOKING_EXCHANGE);
    }

    @Bean
    public Queue paymentSuccessQueue() {
        return QueueBuilder.durable(PAYMENT_SUCCESS_QUEUE)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(PAYMENT_SUCCESS_DLQ)
                .build();
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
        return QueueBuilder.durable(PAYMENT_FAILED_QUEUE)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(PAYMENT_FAILED_DLQ)
                .build();
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
        return QueueBuilder.durable(SEAT_STATUS_QUEUE).build();
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
        return QueueBuilder.durable(BOOKING_CONFIRMED_QUEUE)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(BOOKING_CONFIRMED_DLQ)
                .build();
    }

    @Bean
    public Binding bookingConfirmedBinding() {
        return BindingBuilder
                .bind(bookingConfirmedQueue())
                .to(bookingExchange())
                .with(BOOKING_CONFIRMED_ROUTING_KEY);
    }

    @Bean
    public Queue holdExpirationQueue() {
        return QueueBuilder.durable(HOLD_EXPIRATION_QUEUE)
                .ttl((int) holdTtlMillis)
                .deadLetterExchange(BOOKING_EXCHANGE)
                .deadLetterRoutingKey(HOLD_EXPIRED_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding holdExpirationBinding() {
        return BindingBuilder.bind(holdExpirationQueue())
                .to(bookingExchange())
                .with(HOLD_EXPIRATION_ROUTING_KEY);
    }

    @Bean
    public Queue holdExpiredQueue() {
        return QueueBuilder.durable(HOLD_EXPIRED_QUEUE)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(HOLD_EXPIRED_DLQ)
                .build();
    }

    @Bean
    public Binding holdExpiredBinding() {
        return BindingBuilder.bind(holdExpiredQueue())
                .to(bookingExchange())
                .with(HOLD_EXPIRED_ROUTING_KEY);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DEAD_LETTER_EXCHANGE);
    }

    @Bean
    public Queue paymentSuccessDlq() {
        return QueueBuilder.durable(PAYMENT_SUCCESS_DLQ).build();
    }

    @Bean
    public Binding paymentSuccessDlqBinding() {
        return BindingBuilder.bind(paymentSuccessDlq())
                .to(deadLetterExchange())
                .with(PAYMENT_SUCCESS_DLQ);
    }

    @Bean
    public Queue paymentFailedDlq() {
        return QueueBuilder.durable(PAYMENT_FAILED_DLQ).build();
    }

    @Bean
    public Binding paymentFailedDlqBinding() {
        return BindingBuilder.bind(paymentFailedDlq())
                .to(deadLetterExchange())
                .with(PAYMENT_FAILED_DLQ);
    }

    @Bean
    public Queue holdExpiredDlq() {
        return QueueBuilder.durable(HOLD_EXPIRED_DLQ).build();
    }

    @Bean
    public Binding holdExpiredDlqBinding() {
        return BindingBuilder.bind(holdExpiredDlq())
                .to(deadLetterExchange())
                .with(HOLD_EXPIRED_DLQ);
    }

    @Bean
    public Queue bookingConfirmedDlq() {
        return QueueBuilder.durable(BOOKING_CONFIRMED_DLQ).build();
    }

    @Bean
    public Binding bookingConfirmedDlqBinding() {
        return BindingBuilder.bind(bookingConfirmedDlq())
                .to(deadLetterExchange())
                .with(BOOKING_CONFIRMED_DLQ);
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
