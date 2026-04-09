package com.cinema.booking_service.config;

import org.slf4j.MDC;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitCorrelationConfig {

    @Bean
    public RabbitTemplate rabbitTemplateWithCorrelation(RabbitTemplate rabbitTemplate) {
        rabbitTemplate.setBeforePublishPostProcessors((MessagePostProcessor) message -> {
            String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
            if (correlationId != null && !correlationId.isBlank()) {
                message.getMessageProperties().setHeader(CorrelationIdFilter.CORRELATION_ID_HEADER, correlationId);
                message.getMessageProperties().setCorrelationId(correlationId);
            }
            return message;
        });
        return rabbitTemplate;
    }
}

