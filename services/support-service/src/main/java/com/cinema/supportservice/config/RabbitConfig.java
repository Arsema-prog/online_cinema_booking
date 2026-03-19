package com.cinema.supportservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public Queue bookingConfirmedQueue() {
        return new Queue("booking.confirmed.queue", true); // durable queue
    }
}