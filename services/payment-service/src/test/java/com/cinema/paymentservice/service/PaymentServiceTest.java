package com.cinema.paymentservice.service;

import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private PaymentEventPublisher paymentEventPublisher;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, restTemplate, paymentEventPublisher);
        ReflectionTestUtils.setField(paymentService, "stripeApiKey", "sk_test_mock");
        ReflectionTestUtils.setField(paymentService, "bookingServiceUrl", "http://booking-service:8082");
    }

    @Test
    void shouldReuseExistingPendingMockCheckoutSession() throws Exception {
        UUID bookingId = UUID.randomUUID();
        CreateCheckoutSessionRequest request = buildRequest(bookingId);
        String userEmail = "test@example.com";
        String bearerToken = "Bearer mock-token-123";

        PaymentService.BookingCheckoutResponse snapshot = new PaymentService.BookingCheckoutResponse();
        snapshot.setId(bookingId);
        snapshot.setUserId(UUID.randomUUID());
        snapshot.setStatus("PAYMENT_PENDING");
        snapshot.setTotalAmount(BigDecimal.valueOf(42.50));

        Payment existing = new Payment();
        existing.setId(UUID.randomUUID());
        existing.setBookingId(bookingId);
        existing.setStripeSessionId("mock_session_" + bookingId);
        existing.setAmount(4250L);
        existing.setCurrency("ETB");
        existing.setStatus(Payment.PaymentStatus.PENDING);
        existing.setCreatedAt(Instant.now());

        when(restTemplate.getForEntity(anyString(), any())).thenReturn(ResponseEntity.ok(snapshot));
        when(restTemplate.postForEntity(anyString(), any(), any())).thenReturn(ResponseEntity.ok().build());
        when(paymentRepository.findTopByBookingIdAndStatusOrderByCreatedAtDesc(bookingId, Payment.PaymentStatus.PENDING))
                .thenReturn(Optional.of(existing));

        // FIXED: Now passing all 5 required parameters
        CheckoutSessionResponse response = paymentService.createCheckoutSession(
                request,
                snapshot.getUserId().toString(),  // callerUserId
                userEmail,                        // callerEmail
                false,                            // privilegedCaller
                bearerToken                       // bearerToken
        );

        assertEquals(existing.getStripeSessionId(), response.getSessionId());
        assertEquals(
                "http://localhost:5174/bookers/booking/success?bookingId=" + bookingId + "&session_id=" + existing.getStripeSessionId(),
                response.getUrl()
        );
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void shouldRejectCheckoutForConfirmedBooking() {
        UUID bookingId = UUID.randomUUID();
        CreateCheckoutSessionRequest request = buildRequest(bookingId);
        String userEmail = "test@example.com";
        String bearerToken = "Bearer mock-token-123";

        PaymentService.BookingCheckoutResponse snapshot = new PaymentService.BookingCheckoutResponse();
        snapshot.setId(bookingId);
        snapshot.setUserId(UUID.randomUUID());
        snapshot.setStatus("CONFIRMED");
        snapshot.setTotalAmount(BigDecimal.valueOf(30.00));

        when(restTemplate.getForEntity(anyString(), any())).thenReturn(ResponseEntity.ok(snapshot));

        // FIXED: Now passing all 5 required parameters
        assertThrows(IllegalStateException.class, () -> paymentService.createCheckoutSession(
                request,
                snapshot.getUserId().toString(),  // callerUserId
                userEmail,                        // callerEmail
                false,                            // privilegedCaller
                bearerToken                       // bearerToken
        ));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    private CreateCheckoutSessionRequest buildRequest(UUID bookingId) {
        CreateCheckoutSessionRequest request = new CreateCheckoutSessionRequest();
        request.setBookingId(bookingId);
        request.setAmount(3000L);
        request.setCurrency("ETB");
        request.setSuccessUrl("http://localhost/success");
        request.setCancelUrl("http://localhost/cancel");
        return request;
    }
}