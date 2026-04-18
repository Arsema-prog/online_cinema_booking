package com.cinema.booking_service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Disabled("Requires external Postgres/RabbitMQ; covered by integration tests in docker-compose profile")
class BookingServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}