package com.cinema.apigateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Routes for the back-office and apps that call {@code /api/v1/core/**} and {@code /api/v1/support/**}.
 * Downstream services expose paths like {@code /movies}, {@code /api/users}, {@code /support/tickets/...}.
 */
@Configuration
public class GatewayRoutesConfig {

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("core-service-v1", r -> r
                        .path("/api/v1/core/**")
                        .filters(f -> f.rewritePath("/api/v1/core/(?<segment>.*)", "/${segment}"))
                        .uri("lb://CORE-SERVICE"))
                .route("core-service-legacy", r -> r
                        .path("/core/**")
                        .filters(f -> f.rewritePath("/core/(?<segment>.*)", "/${segment}"))
                        .uri("lb://CORE-SERVICE"))
                .route("booking-service-v1", r -> r
                        .path("/api/v1/booking/**")
                        .filters(f -> f.rewritePath("/api/v1/booking/(?<segment>.*)", "/${segment}"))
                        .uri("lb://BOOKING-SERVICE"))
                .route("support-service-files-v1", r -> r
                        .path("/api/v1/support/files/**")
                        .filters(f -> f.rewritePath("/api/v1/support/files/(?<segment>.*)", "/files/${segment}"))
                        .uri("lb://SUPPORT-SERVICE"))
                .route("support-service-users-v1", r -> r
                        .path("/api/v1/support/users/**")
                        .filters(f -> f.rewritePath("/api/v1/support/(?<segment>.*)", "/api/${segment}"))
                        .uri("lb://SUPPORT-SERVICE"))
                .route("support-service-rules-v1", r -> r
                        .path("/api/v1/support/rules/**")
                        .filters(f -> f.rewritePath("/api/v1/support/(?<segment>.*)", "/api/${segment}"))
                        .uri("lb://SUPPORT-SERVICE"))
                .route("support-service-rest-v1", r -> r
                        .path("/api/v1/support/**")
                        .filters(f -> f.rewritePath("/api/v1/support/(?<segment>.*)", "/support/${segment}"))
                        .uri("lb://SUPPORT-SERVICE"))
                .route("discovery-service", r -> r
                        .path("/discovery/**")
                        .uri("lb://DISCOVERY-SERVICE"))
                .build();
    }
}
