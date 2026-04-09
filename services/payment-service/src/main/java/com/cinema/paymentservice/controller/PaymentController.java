package com.cinema.paymentservice.controller;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.service.PaymentService;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping({"/checkout-session", "/create-session"})
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutSessionRequest request,
            Authentication authentication
    ) {
        try {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String callerUserId = jwt.getSubject();
            boolean privileged = authentication.getAuthorities().stream()
                    .map(grantedAuthority -> grantedAuthority.getAuthority())
                    .anyMatch(authority ->
                            "ROLE_ADMIN".equals(authority)
                                    || "ROLE_MANAGER".equals(authority)
                                    || "ROLE_STAFF".equals(authority));

            CheckoutSessionResponse response = paymentService.createCheckoutSession(request, callerUserId, privileged);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid checkout request for booking {}: {}", request.getBookingId(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            log.warn("Rejected checkout request for booking {}: {}", request.getBookingId(), e.getMessage());
            return ResponseEntity.status(409).build();
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
