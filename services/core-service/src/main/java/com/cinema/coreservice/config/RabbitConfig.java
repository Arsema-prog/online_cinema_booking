// core-service: com/cinema/coreservice/config/RabbitConfig.java
package com.cinema.coreservice.config;

import com.cinema.coreservice.event.SeatStatusEventListener;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // Must match the exchange name in booking service
    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String SEAT_STATUS_QUEUE = "seat.status.queue";
    public static final String SEAT_STATUS_ROUTING_KEY = "seat.status";

    @Bean
    public TopicExchange bookingExchange() {
        return new TopicExchange(BOOKING_EXCHANGE);
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

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public SimpleMessageListenerContainer messageListenerContainer(
            ConnectionFactory connectionFactory,
            MessageListenerAdapter listenerAdapter) {
        SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.setQueueNames(SEAT_STATUS_QUEUE);
        container.setMessageListener(listenerAdapter);
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(SeatStatusEventListener receiver) {
        MessageListenerAdapter adapter = new MessageListenerAdapter(receiver, "receiveMessage");
        adapter.setMessageConverter(jsonMessageConverter());
        return adapter;
    }
}