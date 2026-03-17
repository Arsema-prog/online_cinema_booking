package com.cinema.paymentservice.controller;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.service.PaymentService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout-session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(@Valid @RequestBody CreateCheckoutSessionRequest request) {
        try {
            CheckoutSessionResponse response = paymentService.createCheckoutSession(request);
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Stripe error while creating checkout session: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}