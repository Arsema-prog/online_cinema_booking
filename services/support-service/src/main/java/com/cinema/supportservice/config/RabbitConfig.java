package com.cinema.supportservice.config;

import org.springframework.amqp.core.Queue;
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

    @Value("${rabbitmq.queue.bookingConfirmed}")
    private String bookingConfirmedQueue;

    @Bean
    public Queue bookingConfirmedQueue() {
        return new Queue(bookingConfirmedQueue, true);
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