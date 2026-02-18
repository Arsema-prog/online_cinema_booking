# Support Service API Contract

Service: support-service
Base URL: /api
Auth: OAuth2 JWT (Keycloak)
Content-Type: application/json

---

# Authentication Model

Authentication: Required unless explicitly marked public.

JWT Issuer:

```
http://localhost:8180/realms/cinema-realm
```

JWT must include realm roles:

```
realm_access.roles
```

Example:

```
ADMIN
MANAGER
USER
```

Mapped internally as:

```
ROLE_ADMIN
ROLE_MANAGER
ROLE_USER
```

---

# Public Endpoints

## Register User

Endpoint:

```
POST /api/auth/register
```

Authentication:

```
Public
```

Description:

```
Creates a new user in Keycloak and support-service database.
Assigns default role USER.
```

Request Body:

```
{
  "username": "john",
  "password": "password123",
  "email": "john@email.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

Validation:

username: required
password: required
email: valid email

Response:

201 Created

No response body.

Errors:

409 Conflict

```
Username already exists
```

409 Conflict

```
Email already exists
```

500 Internal Server Error

```
Keycloak user creation failed
```

---

# Protected Endpoints

All endpoints below require JWT.

---

## List Users

Endpoint:

```
GET /api/users
```

Authorization:

```
ROLE_ADMIN
ROLE_MANAGER
```

Query Parameters:

search (optional string)

page (optional int, default 0)

size (optional int, default 20)

sort (optional string, default username,asc)

Example:

```
GET /api/users?page=0&size=20&search=john
```

Response:

```
200 OK
```

Body:

```
{
  "content": [
    {
      "id": "uuid",
      "username": "john",
      "email": "john@email.com",
      "firstName": "John",
      "lastName": "Doe",
      "enabled": true,
      "roles": ["USER"],
      "createdTimestamp": "2026-02-18T10:00:00Z"
    }
  ],
  "pageable": {},
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

## Get User

Endpoint:

```
GET /api/users/{userId}
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
  "username": "john",
  "email": "john@email.com",
  "firstName": "John",
  "lastName": "Doe",
  "enabled": true,
  "roles": ["USER"],
  "createdTimestamp": "2026-02-18T10:00:00Z"
}
```

Errors:

404 Not Found

---

## Update User

Endpoint:

```
PUT /api/users/{userId}
```

Authorization:

```
ROLE_ADMIN
ROLE_MANAGER
```

Request Body:

```
{
  "email": "new@email.com",
  "firstName": "John",
  "lastName": "Updated",
  "enabled": true
}
```

Response:

```
200 OK
```

Body:

```
UserDto
```

---

## Delete User

Endpoint:

```
DELETE /api/users/{userId}
```

Authorization:

```
ROLE_ADMIN
```

Response:

```
204 No Content
```

---

## Reset Password

Endpoint:

```
PUT /api/users/{userId}/reset-password
```

Authorization:

```
ROLE_ADMIN
ROLE_MANAGER
```

Request Body:

```
{
  "newPassword": "newPassword123"
}
```

Response:

```
200 OK
```

---

## Assign Roles

Endpoint:

```
POST /api/users/{userId}/roles
```

Authorization:

```
ROLE_ADMIN
ROLE_MANAGER
```

Request Body:

```
[
  "ADMIN",
  "MANAGER"
]
```

Response:

```
200 OK
```

---

## Remove Roles

Endpoint:

```
DELETE /api/users/{userId}/roles
```

Authorization:

```
ROLE_ADMIN
ROLE_MANAGER
```

Request Body:

```
[
  "ADMIN"
]
```

Response:

```
200 OK
```

---

# Data Models

## UserDto

```
{
  "id": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "enabled": true,
  "roles": ["string"],
  "createdTimestamp": "ISO-8601 timestamp"
}
```

---

# Security Contract

Authentication:

```
Bearer JWT required
```

Header:

```
Authorization: Bearer <access_token>
```

JWT Issuer:

```
Keycloak
```

---

# Service Responsibilities

support-service owns:

User registration
User management
Role assignment
Password reset
User synchronization with Keycloak

---

# Ownership Boundary

Database schema:

```
support
```

Authentication provider:

```
Keycloak
```

support-service acts as:

Identity provisioning service
User management service

---

# Version

Version:

```
v1
```

Last Updated:

```
2026-02-18
```
