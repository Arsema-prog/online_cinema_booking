package com.cinema.paymentservice.service;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.model.Payment;
import com.cinema.paymentservice.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    @Transactional
    public CheckoutSessionResponse createCheckoutSession(CreateCheckoutSessionRequest request) throws StripeException {
        // 1. Create a pending payment record in local DB
        Payment payment = new Payment();
        payment.setBookingId(request.getBookingId());
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency());
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setCreatedAt(Instant.now());
        // stripeEventId will be set later when webhook arrives
        payment = paymentRepository.save(payment);

        // 2. Build Stripe session parameters
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(request.getSuccessUrl().replace("{CHECKOUT_SESSION_ID}", "{CHECKOUT_SESSION_ID}"))
                .setCancelUrl(request.getCancelUrl())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(request.getCurrency())
                                                .setUnitAmount(request.getAmount())
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Cinema Booking #" + request.getBookingId())
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .putMetadata("bookingId", request.getBookingId().toString())
                .putMetadata("paymentId", payment.getId().toString())
                .build();

        // 3. Create session with Stripe
        Session session = Session.create(params);

        // 4. Update payment record with Stripe session ID
        payment.setStripeSessionId(session.getId());
        paymentRepository.save(payment);

        log.info("Created Stripe session {} for booking {}", session.getId(), request.getBookingId());

        return new CheckoutSessionResponse(session.getId(), session.getUrl());
    }
}