# API Contracts (Core Booking Journey)

## Booking Service

- `POST /bookings/hold`
  - Request: `HoldRequest { userId, showId, seatIds[] }`
  - Response: `HoldResponse { bookingId, status, heldSeatIds[], expiresAt, expiresAtEpochMs }`
- `POST /bookings/{id}/snacks`
  - Request: `{ snackDetails, snacksTotal }`
  - Response: updated booking aggregate
- `POST /bookings/{id}/initiate-payment`
  - Response: booking in `PAYMENT_PENDING`
- `GET /bookings/{id}`
  - Response includes `id`, `userId`, `status`, `totalAmount`

## Payment Service

- `POST /api/payments/checkout-session`
  - Request: `CreateCheckoutSessionRequest { bookingId, amount, currency, successUrl, cancelUrl }`
  - Response: `CheckoutSessionResponse { sessionId, url }`
  - Authorization:
    - `USER` can only create checkout for own booking.
    - `ADMIN`, `MANAGER`, `STAFF` can create checkout for any booking.
- `POST /api/payments/webhook`
  - Stripe-signed endpoint.
  - Drives authoritative booking confirmation/failure through events.

## Support Service

- `GET /api/support/bookings/uuid/{bookingId}/tickets`
  - Resolves generated tickets for a booking UUID.
- `POST /api/rules/activate/version/{version}`
  - Activates a previously uploaded DRL ruleset by semantic version.
- `POST /api/rules/validate`
  - Validates DRL compilation without activating.
- `POST /api/support/tickets/{ticketId}/validate`
  - Marks ticket as `USED` for entry validation.

## Correlation and Idempotency

- Correlation ID header: `X-Correlation-Id` propagated HTTP and AMQP.
- Idempotent stores:
  - `payment_event_inbox` for Stripe webhook dedupe.
  - `message_inbox` for booking/payment consumer dedupe.
