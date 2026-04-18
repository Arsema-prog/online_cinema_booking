package com.cinema.paymentservice.controller;

import com.cinema.paymentservice.dto.CreateCheckoutSessionRequest;
import com.cinema.paymentservice.dto.CheckoutSessionResponse;
import com.cinema.paymentservice.service.PaymentService;
import com.stripe.exception.StripeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

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
            CheckoutCaller caller = resolveCaller(authentication);

            CheckoutSessionResponse response = paymentService.createCheckoutSession(
                    request,
                    caller.userId(),
                    caller.email(),
                    caller.privileged(),
                    caller.bearerToken()
            );
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

    @PostMapping("/mock/complete/{sessionId}")
    public ResponseEntity<CheckoutSessionResponse> completeMockCheckout(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        try {
            CheckoutCaller caller = resolveCaller(authentication);
            CheckoutSessionResponse response = paymentService.completeMockCheckout(
                    sessionId,
                    caller.userId(),
                    caller.privileged(),
                    caller.bearerToken()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid mock checkout completion for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            log.warn("Rejected mock checkout completion for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.status(409).build();
        }
    }

    private CheckoutCaller resolveCaller(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String callerUserId = jwt.getSubject();
        String callerEmail = jwt.getClaimAsString("email");
        if (callerEmail == null || callerEmail.isBlank()) {
            String preferred = jwt.getClaimAsString("preferred_username");
            if (preferred != null && preferred.contains("@")) {
                callerEmail = preferred;
            }
        }
        boolean privileged = authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .anyMatch(authority ->
                        "ROLE_ADMIN".equals(authority)
                                || "ROLE_MANAGER".equals(authority)
                                || "ROLE_STAFF".equals(authority));
        String bearerToken = jwt.getTokenValue();

        return new CheckoutCaller(callerUserId, callerEmail, privileged, bearerToken);
    }

    private record CheckoutCaller(String userId, String email, boolean privileged, String bearerToken) {}

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
