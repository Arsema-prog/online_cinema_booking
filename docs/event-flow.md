# Booking Event Flow

```mermaid
flowchart LR
  bookersUi[BookersUI] --> gateway[ApiGateway]
  gateway --> bookingSvc[BookingService]
  bookingSvc -->|hold_expiration_message| rabbitMq[RabbitMQ]
  gateway --> paymentSvc[PaymentService]
  paymentSvc --> stripe[Stripe]
  stripe -->|checkout.session.completed_or_failed| paymentSvc
  paymentSvc -->|payment.succeeded_or_failed| rabbitMq
  rabbitMq --> bookingSvc
  bookingSvc -->|booking.confirmed| rabbitMq
  rabbitMq --> supportSvc[SupportService]
```

## State Machine

- `SEATS_HELD` -> `SNACKS_SELECTED` -> `PAYMENT_PENDING` -> `CONFIRMED`
- Failure paths:
  - `PAYMENT_PENDING` -> `FAILED`
  - `SEATS_HELD | SNACKS_SELECTED | PAYMENT_PENDING` -> `EXPIRED`
  - `SEATS_HELD | SNACKS_SELECTED | PAYMENT_PENDING` -> `CANCELLED`

## Non-Negotiable Invariants

- Booking is confirmed only after Stripe webhook success.
- Duplicate webhooks and duplicate queue deliveries are safe.
- Seat release on failure/expiration/cancellation broadcasts realtime availability.
