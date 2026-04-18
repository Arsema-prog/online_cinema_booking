package com.cinema.supportservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import com.cinema.supportservice.dto.BookingConfirmedEvent;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableRabbit
public class RabbitConfig {

    public static final String DEAD_LETTER_EXCHANGE = "booking.dlx";
    public static final String BOOKING_CONFIRMED_DLQ = "booking.confirmed.queue.dlq";

    @Value("${rabbitmq.queue.bookingConfirmed}")
    private String bookingConfirmedQueue;

    @Bean
    public Queue bookingConfirmedQueue() {
        return QueueBuilder.durable(bookingConfirmedQueue)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(BOOKING_CONFIRMED_DLQ)
                .build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DEAD_LETTER_EXCHANGE);
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
    public MessageConverter messageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);

        // Configure type mapping
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();

        Map<String, Class<?>> idClassMapping = new HashMap<>();
        // Map the sender's type to your local class
        idClassMapping.put(
                "com.cinema.booking_service.dto.BookingConfirmedEvent",
                BookingConfirmedEvent.class
        );

        typeMapper.setIdClassMapping(idClassMapping);
        typeMapper.setTrustedPackages(
                "com.cinema.booking_service.dto",
                "com.cinema.supportservice.dto",
                "java.util",
                "java.lang"
        );

        converter.setJavaTypeMapper(typeMapper);

        return converter;
    }

}
