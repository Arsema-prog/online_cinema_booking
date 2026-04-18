# Cinema Platform Architecture

## Service Topology

- `api-gateway`: OAuth2 entrypoint, route fan-out, correlation propagation.
- `booking-service`: seat hold lifecycle, saga state transitions, websocket seat updates.
- `payment-service`: Stripe checkout + webhook processing + payment outcome publishing.
- `support-service`: ticket generation, Drools pricing, rules management, ticket validation.
- `core-service`: branches/movies/screens/screenings/media domain APIs.

## Booking and Payment Event Contracts

### `payment.succeeded`

- `eventId` (string): unique idempotency key.
- `bookingId` (UUID): booking aggregate reference.
- `paymentId` (UUID): payment aggregate reference.
- `stripeEventId` (string): Stripe source event id.
- `stripeSessionId` (string): checkout session reference.
- `amount` (long): amount in smallest currency unit.
- `currency` (string): ISO currency.
- `occurredAt` (instant): event timestamp.

### `payment.failed`

- Same contract as `payment.succeeded` plus:
- `reason` (string): normalized failure reason.

## Reliability Baseline

- Inbox deduplication for webhook events (`payment-service`) and consumer events (`booking-service`, `support-service`).
- RabbitMQ DLQ routing on payment queues, hold-expiration queues, and booking-confirmed queue.
- Consumer retry policy with exponential backoff and poison-message reject.

## Security Baseline

- OAuth2/JWT resource-server enabled in `booking-service`, `payment-service`, `support-service`, `core-service`.
- Role model enforced with `ROLE_USER`, `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_STAFF`.
- Payment checkout ownership enforced: non-privileged caller can pay only for own booking.
