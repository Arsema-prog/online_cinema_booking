# Core Service API Contracts

## Screens

### Get all screens
- **Endpoint:** GET /screens
- **Request Body:** None
- **Response Example:**
```json
[
  {
    "id": 1,
    "name": "Screen 1",
    "rows": 5,
    "seatsPerRow": 10,
    "branchId": 1
  }
]
```
### Get screen by ID
- **Endpoint:** GET /screens/{id}
- **Request Body:** None
- **Response Example:**
```json
{
  "id": 1,
  "name": "Screen 1",
  "rows": 5,
  "seatsPerRow": 10,
  "branchId": 1
}
```
### Create screen
- **Endpoint:** POST /screens
- **Request Body Example:**
```json
{
  "name": "Screen 2",
  "branchId": 1,
  "rows": 5,
  "seatsPerRow": 10,
  "numberOfSeats": 50
}
```
- **Response Example:**
```json
{
  "id": 2,
  "name": "Screen 2",
  "rows": 5,
  "seatsPerRow": 10,
  "branchId": 1,
  "seats": [
    { "id": 1, "seatNumber": "S1" },
    { "id": 2, "seatNumber": "S2" }
  ]
}
```

## Seats
### Get all seats
- **Endpoint:** GET /seats
- **Request Body:** None
- **Response Example:**
```json
[
  { "id": 1, "seatNumber": "S1", "screenId": 1 },
  { "id": 2, "seatNumber": "S2", "screenId": 1 }
]
```

### Get seats by screen
- **Endpoint:** GET /seats/screen/{screenId}
- **Request Body:** None
- **Response Example:**
```json
[
  { "id": 1, "seatNumber": "S1", "screenId": 1 },
  { "id": 2, "seatNumber": "S2", "screenId": 1 }
]
```

# Core Service Event Contracts (RabbitMQ)

## Seat Hold Events

### Event: seat.hold
- **Description:** A seat has been temporarily held for a user.
- **Routing Key:** seat.hold
- **Payload Example:**
```json
{
  "screenId": 1,
  "seatId": 10,
  "userId": 5,
  "holdExpiresAt": "2026-02-14T05:30:00Z"
}
``` 
### Event: seat.release
- **Description:** A held seat has been released (either by timeout or user cancellation).
- **Routing Key:** seat.release
- **Payload Example:**
```json
{
  "screenId": 1,
  "seatId": 10,
  "userId": 5
}
```
### Event: seat.booked
- **Description:** A seat has been successfully booked and can no longer be held.
- **Routing Key:** seat.booked
- **Payload Example:**
```json
{
  "screenId": 1,
  "seatId": 10,
  "userId": 5,
  "bookingId": 123
}
```
