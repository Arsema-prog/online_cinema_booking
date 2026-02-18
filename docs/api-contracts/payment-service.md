# Payment Service API Contract

Service: payment-service
Version: v1
Base URL: /api/payments
Authentication: OAuth2 JWT (Keycloak) except webhook

---

# Responsibilities

payment-service is responsible for:

• Creating Stripe Checkout Sessions
• Processing Stripe webhooks
• Maintaining append-only payment ledger
• Publishing payment events to RabbitMQ

Database schema owned:

```
payment
```

External integrations:

• Stripe API
• RabbitMQ
• Keycloak (JWT validation)

---

# Authentication Contract

Authentication type:

```
Bearer JWT
```

Header:

```
Authorization: Bearer <access_token>
```

JWT issuer:

```
http://localhost:8180/realms/cinema-realm
```

Required roles:

```
USER
ADMIN
MANAGER
```

Webhook endpoint is public (no authentication).

---

# Endpoint 1 — Create Checkout Session

Endpoint:

```
POST /api/payments/checkout-session
```

Authentication:

```
Required
```

Authorization:

```
ROLE_USER
ROLE_ADMIN
ROLE_MANAGER
```

Description:

Creates a Stripe Checkout Session for a booking.

Request Body:

```
{
  "bookingId": "uuid",
  "amount": 2500,
  "currency": "usd",
  "successUrl": "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "http://localhost:3000/cancel"
}
```

Field definitions:

bookingId — UUID of booking
amount — amount in cents
currency — ISO currency code
successUrl — redirect URL after payment success
cancelUrl — redirect URL after cancellation

Response:

```
200 OK
```

Body:

```
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

Errors:

400 Bad Request
401 Unauthorized
500 Stripe error

---

# Endpoint 2 — Stripe Webhook

Endpoint:

```
POST /api/payments/webhook
```

Authentication:

```
None (Public endpoint)
```

Authorization:

```
Stripe signature verification required
```

Header:

```
Stripe-Signature: <signature>
```

Body:

Raw Stripe event payload

Example event type:

```
checkout.session.completed
checkout.session.expired
checkout.session.async_payment_failed
```

Response:

```
200 OK
```

Errors:

400 Invalid signature

---

# Endpoint 3 — Get Payment by ID

Endpoint:

```
GET /api/payments/{paymentId}
```

Authentication:

```
Required
```

Authorization:

```
ROLE_ADMIN
ROLE_MANAGER
```

Response:

```
200 OK
```

Body:

```
{
  "id": "uuid",
  "stripeEventId": "evt_...",
  "stripeSessionId": "cs_test_...",
  "bookingId": "uuid",
  "amount": 2500,
  "currency": "usd",
  "status": "SUCCEEDED",
  "failureReason": null,
  "createdAt": "2026-02-18T10:00:00Z"
}
```

Errors:

404 Not Found

---

# Data Model Contract

Payment object:

```
{
  "id": "uuid",
  "stripeEventId": "string",
  "stripeSessionId": "string",
  "bookingId": "uuid",
  "amount": "long",
  "currency": "string",
  "status": "PENDING | SUCCEEDED | FAILED",
  "failureReason": "string",
  "createdAt": "timestamp"
}
```

---

# Idempotency Contract

Stripe events must be processed idempotently.

Unique key:

```
stripeEventId
```

Duplicate events must be ignored.

---

# RabbitMQ Event Contracts

Exchange:

```
payment.exchange
```

Exchange type:

```
topic
```

---

# Event — payment.succeeded

Routing key:

```
payment.succeeded
```

Payload:

```
{
  "eventId": "uuid",
  "paymentId": "uuid",
  "bookingId": "uuid",
  "stripeSessionId": "cs_test_...",
  "amount": 2500,
  "currency": "usd",
  "occurredAt": "2026-02-18T10:00:00Z"
}
```

Consumers:

booking-service

---

# Event — payment.failed

Routing key:

```
payment.failed
```

Payload:

```
{
  "eventId": "uuid",
  "paymentId": "uuid",
  "bookingId": "uuid",
  "stripeSessionId": "cs_test_...",
  "amount": 2500,
  "currency": "usd",
  "failureReason": "string",
  "occurredAt": "2026-02-18T10:00:00Z"
}
```

Consumers:

booking-service

---

# Security Boundary

Protected endpoints:

```
POST /checkout-session
GET /{paymentId}
```

Public endpoint:

```
POST /webhook
```

Webhook security:

Stripe signature verification required.

---

# Ownership

payment-service owns:

Payment ledger
Stripe session management
Payment event publishing

payment-service does NOT own:

Booking state
User authentication

---

# Versioning

Version:

```
v1
```

Last updated:

```
2026-02-18
```
