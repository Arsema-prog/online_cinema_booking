# Support Service API Contract

## Drools Rules Management and Pricing Evaluation

**Service Name:** support-service
**API Version:** v1
**Base Path:** `/api/rules`
**Protocol:** HTTP/REST
**Data Format:** JSON
**Authentication:** Required (JWT via API Gateway)

---

# 1. Purpose

This document defines the REST API contract for managing Drools business rules and evaluating pricing within the cinema booking platform.

The support-service is responsible for:

* Managing rule uploads and versioning
* Activating and maintaining the currently active ruleset
* Evaluating ticket pricing using Drools
* Providing pricing calculation transparency

This contract follows the Contract-First Development approach, where interfaces are defined before implementation.

---

# 2. Definitions

## 2.1 Ruleset

A Ruleset represents a Drools Rule Language (DRL) file containing business logic for pricing evaluation.

Only one Ruleset may be active at any given time.

---

## 2.2 Pricing Evaluation

Pricing evaluation is the process of calculating the final ticket price by applying business rules to an initial base price.

---

# 3. Authentication and Authorization

All endpoints require authentication using a valid JWT.

Authorization requirements:

| Endpoint           | Required Role    |
| ------------------ | ---------------- |
| Upload Ruleset     | ADMIN or MANAGER |
| List Rulesets      | ADMIN or MANAGER |
| Activate Ruleset   | ADMIN or MANAGER |
| Get Active Ruleset | AUTHENTICATED    |
| Evaluate Price     | AUTHENTICATED    |

---

# 4. Data Models

## 4.1 Ruleset Metadata

Represents metadata associated with a ruleset.

```json
{
  "id": 1,
  "version": "1.0.0",
  "name": "pricing.drl",
  "active": true,
  "createdAt": "2026-02-20T10:00:00Z",
  "activatedAt": "2026-02-20T10:01:00Z"
}
```

Field definitions:

| Field       | Type      | Description                         |
| ----------- | --------- | ----------------------------------- |
| id          | Long      | Unique identifier                   |
| version     | String    | Version identifier                  |
| name        | String    | Ruleset filename                    |
| active      | Boolean   | Indicates whether ruleset is active |
| createdAt   | Timestamp | Creation time                       |
| activatedAt | Timestamp | Activation time                     |

---

## 4.2 Price Evaluation Request

Represents the input for pricing evaluation.

```json
{
  "showId": 101,
  "seatCategory": "VIP",
  "basePrice": 1000,
  "customerId": 501,
  "promoCode": "SUMMER10",
  "currency": "ETB"
}
```

Field definitions:

| Field        | Type   | Description          |
| ------------ | ------ | -------------------- |
| showId       | Long   | Show identifier      |
| seatCategory | String | Seat category        |
| basePrice    | Long   | Initial ticket price |
| customerId   | Long   | Customer identifier  |
| promoCode    | String | Promotional code     |
| currency     | String | Currency code        |

---

## 4.3 Price Evaluation Response

Represents the calculated price and applied rules.

```json
{
  "finalPrice": 1350,
  "currency": "ETB",
  "breakdown": [
    {
      "ruleName": "VIP multiplier",
      "description": "VIP seats multiplier applied",
      "appliedValue": 1.5
    }
  ]
}
```

Field definitions:

| Field      | Type   | Description            |
| ---------- | ------ | ---------------------- |
| finalPrice | Long   | Final calculated price |
| currency   | String | Currency code          |
| breakdown  | Array  | Applied rules          |

Breakdown item structure:

| Field        | Type   | Description           |
| ------------ | ------ | --------------------- |
| ruleName     | String | Rule name             |
| description  | String | Rule description      |
| appliedValue | Object | Value applied by rule |

---

# 5. API Endpoints

---

## 5.1 Upload Ruleset

Uploads a new ruleset.

**Endpoint**

```
POST /api/rules
```

**Content-Type**

```
multipart/form-data
```

**Parameters**

| Name     | Type    | Required | Description          |
| -------- | ------- | -------- | -------------------- |
| file     | File    | Yes      | DRL file             |
| version  | String  | No       | Ruleset version      |
| activate | Boolean | No       | Activate immediately |

**Response**

Status: 201 Created

Returns Ruleset Metadata.

---

**Error Responses**

| Status | Description            |
| ------ | ---------------------- |
| 400    | Invalid file           |
| 401    | Unauthorized           |
| 403    | Forbidden              |
| 409    | Version already exists |

---

## 5.2 List Rulesets

Returns paginated list of rulesets.

**Endpoint**

```
GET /api/rules
```

**Query Parameters**

| Name | Type    | Required |
| ---- | ------- | -------- |
| page | Integer | No       |
| size | Integer | No       |

**Response**

Status: 200 OK

Returns paginated Ruleset Metadata list.

---

## 5.3 Get Active Ruleset

Returns currently active ruleset.

**Endpoint**

```
GET /api/rules/active
```

**Response**

Status: 200 OK

Returns Ruleset Metadata.

---

**Error Responses**

| Status | Description       |
| ------ | ----------------- |
| 404    | No active ruleset |

---

## 5.4 Activate Ruleset

Activates a specific ruleset.

**Endpoint**

```
POST /api/rules/{ruleId}/activate
```

**Path Parameters**

| Name   | Type | Description        |
| ------ | ---- | ------------------ |
| ruleId | Long | Ruleset identifier |

**Response**

Status: 200 OK

---

**Error Responses**

| Status | Description       |
| ------ | ----------------- |
| 404    | Ruleset not found |
| 401    | Unauthorized      |
| 403    | Forbidden         |

---

## 5.5 Evaluate Price

Evaluates ticket pricing using active ruleset.

**Endpoint**

```
POST /api/rules/evaluate/price
```

**Request Body**

Price Evaluation Request

**Response**

Status: 200 OK

Returns Price Evaluation Response.

---

**Error Responses**

| Status | Description       |
| ------ | ----------------- |
| 400    | Evaluation failed |
| 404    | No active ruleset |
| 401    | Unauthorized      |

---

# 6. Ruleset State Management

System constraints:

* Only one ruleset may be active at a time
* Activating a ruleset deactivates any previously active ruleset
* Rules must successfully compile before activation

---

# 7. Service Integration

This endpoint is intended to be consumed by:

* booking-service
* gateway-service
* administrative interfaces

Primary integration endpoint:

```
POST /api/rules/evaluate/price
```

---

# 8. Versioning

Rulesets must have unique version identifiers.

Version format examples:

```
1.0.0
1.1.0
2026-02-20T10:00:00Z
```

---

# 9. Non-Functional Requirements

The service shall:

* Compile rules dynamically
* Evaluate rules deterministically
* Support ruleset versioning
* Maintain pricing auditability
* Provide consistent pricing evaluation results

---

# 10. Contract Status

Status: Approved
Version: v1
Owner: support-service
