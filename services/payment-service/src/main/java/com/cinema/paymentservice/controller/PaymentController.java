package com.cinema.paymentservice.controller;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.service.PaymentService;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout-session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(@RequestBody CreateCheckoutSessionRequest request) {
        try {
            CheckoutSessionResponse response = paymentService.createCheckoutSession(request);
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

//    @PostMapping("/webhook")
//    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload,
//                                                      @RequestHeader("Stripe-Signature") String sigHeader) {
//        try {
//            paymentService.handleWebhook(payload, sigHeader);
//            return ResponseEntity.ok("Webhook processed");
//        } catch (Exception e) {
//            log.error("Webhook error: {}", e.getMessage());
//            return ResponseEntity.status(400).body("Webhook error");
//        }
//    }
}