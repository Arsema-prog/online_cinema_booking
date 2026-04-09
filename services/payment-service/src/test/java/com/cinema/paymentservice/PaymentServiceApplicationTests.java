package com.cinema.paymentservice;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requires external Postgres/RabbitMQ; covered by integration tests in docker-compose profile")
class PaymentServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
