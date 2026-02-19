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
    public static final String PAYMENT_SUCCESS_QUEUE = "payment.success.queue";

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
                .to(bookingExchange())
                .with("payment.success");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
