# Operations Runbook

## Local Boot

- Copy `.env.example` to `.env` and fill secrets.
- Start stack:
  - `docker compose up --build`
- Verify health:
  - `http://localhost:8761/actuator/health`
  - `http://localhost:8090/actuator/health`
  - `http://localhost:8082/actuator/health`
  - `http://localhost:8083/actuator/health`
  - `http://localhost:8084/actuator/health`

## Stripe Webhook-Only Confirmation

- Confirm bookings only via `POST /api/payments/webhook`.
- Do not call direct booking confirmation from clients.

## DLQ and Replay

- Inspect queues in RabbitMQ UI at `http://localhost:15672`.
- Critical DLQs:
  - `payment.success.queue.dlq`
  - `payment.failed.queue.dlq`
  - `booking.hold.expired.queue.dlq`
  - `booking.confirmed.queue.dlq`

## Incident Checklist

- Verify correlation ID appears in gateway + service logs.
- Check payment webhook inbox dedupe for duplicate Stripe events.
- Check booking/support message inbox tables for duplicate consumer deliveries.
