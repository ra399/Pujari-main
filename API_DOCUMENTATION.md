# Pujari API Documentation

## Base URL
```
http://localhost:PORT/api
```

## Table of Contents
1. [Authentication](#authentication)
2. [User Endpoints](#user-endpoints)
3. [Provider Endpoints](#provider-endpoints)
4. [Booking Endpoints](#booking-endpoints)
5. [Admin Endpoints](#admin-endpoints)
6. [Provider Availability Endpoints](#provider-availability-endpoints)
7. [Rating Endpoints](#rating-endpoints)
8. [Data Models](#data-models)

---

## Authentication

### Firebase Login
**Endpoint:** `POST /auth/firebase-login`

**Description:** Login using Firebase ID token. Creates a new user if not exists.

**Request Body:**
```json
{
  "idToken": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login success",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "string",
      "name": "string",
      "phone": "string",
      "email": "string",
      "role": "USER | PROVIDER | ADMIN",
      "profile_pic": "string",
      "location": "string",
      "bio": "string",
      "isPhoneVerified": true,
      "authProvider": "firebase"
    }
  }
}
```

**Error Responses:**
- `400`: Missing idToken
- `401`: Invalid or expired token

**Notes:**
- Use the returned JWT token in Authorization header for subsequent requests
- Format: `Authorization: Bearer <token>`

---

## User Endpoints

### Get Current User Profile
**Endpoint:** `GET /users/me`

**Authentication:** Required (USER or PROVIDER role)

**Response (200):**
```json
{
  "success": true,
  "message": "Get profile placeholder",
  "data": {
    "_id": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "role": "USER | PROVIDER",
    "profile_pic": "string",
    "location": "string",
    "bio": "string"
  }
}
```

### Get All Users
**Endpoint:** `GET /users`

**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "string",
    "name": "string",
    "phone": "string"
  }
}
```

---

## Provider Endpoints

### List Providers (Public)
**Endpoint:** `GET /providers`

**Authentication:** Not required

**Query Parameters:**
- `service` (string): Filter by service key (e.g., "puja", "havan")
- `serviceType` (string): Legacy parameter, same as `service`
- `city` (string): Filter by city
- `lat` (number): Latitude for distance-based search
- `long` (number): Longitude for distance-based search
- `radius` (number): Search radius in kilometers (requires lat & long)

**Response (200):**
```json
[
  {
    "providerId": "string",
    "name": "string",
    "services": [
      {
        "name": "string",
        "key": "string",
        "price": 1000
      }
    ],
    "city": "string",
    "rating": 4.5
  }
]
```

**Notes:**
- Only returns APPROVED and ACTIVE providers
- All three parameters (lat, long, radius) must be provided together for distance search

### Get Provider Details (Public)
**Endpoint:** `GET /providers/:id`

**Authentication:** Not required

**Response (200):**
```json
{
  "providerId": "string",
  "name": "string",
  "bio": "string",
  "experienceYears": 5,
  "rating": 4.5,
  "location": {
    "city": "string"
  },
  "services": [
    {
      "name": "Puja Service",
      "key": "puja_service",
      "price": 1000
    }
  ],
  "availability": [
    {
      "_id": "string",
      "dayOfWeek": 0,
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ]
}
```

**Error Responses:**
- `404`: Provider not found or not active

**Notes:**
- dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Only shows APPROVED and ACTIVE providers

### Apply as Provider
**Endpoint:** `POST /providers/apply`

**Authentication:** Required (PROVIDER role)

**Request Body:**
```json
{
  "services": [
    {
      "name": "Puja Service",
      "key": "puja_service",
      "price": 1000,
      "duration": 60,
      "description": "Traditional puja service"
    }
  ],
  "location": {
    "city": "Mumbai",
    "lat": "19.0760",
    "long": "72.8777"
  },
  "experienceYears": 5
}
```

**Response (201):**
```json
{
  "message": "Provider application submitted",
  "provider": {
    "_id": "string",
    "user": "userId",
    "services": [...],
    "location": {...},
    "experienceYears": 5,
    "status": "PENDING",
    "rating": 0,
    "isActive": false
  }
}
```

**Error Responses:**
- `400`: Validation errors (missing fields, duplicate application)

**Notes:**
- Services automatically normalize keys from names
- Provider status starts as PENDING and requires admin approval
- Geo coordinates are generated automatically from lat/long

### Get My Provider Profile
**Endpoint:** `GET /providers/me`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
{
  "_id": "string",
  "user": "userId",
  "services": [...],
  "location": {...},
  "experienceYears": 5,
  "status": "APPROVED | PENDING | REJECTED",
  "rating": 4.5,
  "isActive": true,
  "bio": "string"
}
```

**Error Responses:**
- `404`: Provider profile not found

### Update My Provider Profile
**Endpoint:** `PATCH /providers/me`

**Authentication:** Required (PROVIDER role)

**Request Body (all fields optional):**
```json
{
  "bio": "string",
  "services": [
    {
      "name": "string",
      "price": 1000,
      "duration": 60,
      "description": "string"
    }
  ],
  "location": {
    "city": "string",
    "lat": "string",
    "long": "string"
  },
  "experienceYears": 5
}
```

**Response (200):**
```json
{
  "_id": "string",
  "user": "userId",
  "services": [...],
  "location": {...},
  "experienceYears": 5,
  "status": "string",
  "rating": 4.5,
  "isActive": true,
  "bio": "string"
}
```

**Error Responses:**
- `400`: Validation errors
- `404`: Provider profile not found

### Toggle Provider Active Status
**Endpoint:** `PATCH /providers/me/active`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
{
  "message": "Provider active status updated",
  "isActive": true
}
```

**Error Responses:**
- `403`: Provider not approved yet
- `404`: Provider profile not found

**Notes:**
- Providers can only toggle active status if they are APPROVED

### Get Provider Bookings
**Endpoint:** `GET /providers/bookings`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "user": {
        "name": "string",
        "phone": "string"
      },
      "serviceKey": "string",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "12:00",
      "price": 1000,
      "status": "PENDING | APPROVED | REJECTED | CANCELLED | COMPLETED",
      "createdAt": "2024-01-15T08:30:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns all bookings for the current provider
- Sorted by date and start time (ascending)

### Approve Booking
**Endpoint:** `PATCH /providers/bookings/:id/approve`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
{
  "success": true,
  "message": "Booking approved successfully",
  "data": {
    "_id": "string",
    "user": {
      "name": "string",
      "phone": "string"
    },
    "serviceKey": "string",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "price": 1000,
    "status": "APPROVED"
  }
}
```

**Error Responses:**
- `400`: Booking is not in PENDING status
- `403`: Not authorized to approve this booking
- `404`: Booking not found

**Notes:**
- Only PENDING bookings can be approved
- Automatically updates provider availability slots

### Reject Booking
**Endpoint:** `PATCH /providers/bookings/:id/reject`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
{
  "success": true,
  "message": "Booking rejected successfully",
  "data": {
    "_id": "string",
    "status": "REJECTED",
    ...
  }
}
```

**Error Responses:**
- `400`: Booking is not in PENDING status
- `403`: Not authorized to reject this booking
- `404`: Booking not found

---

## Booking Endpoints

### Create Booking
**Endpoint:** `POST /bookings`

**Authentication:** Required (USER or PROVIDER role)

**Request Body:**
```json
{
  "providerId": "string",
  "serviceKey": "string",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created",
  "data": {
    "_id": "string",
    "user": "userId",
    "provider": "providerId",
    "serviceKey": "string",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "price": 1000,
    "status": "PENDING",
    "isRated": false,
    "createdAt": "2024-01-15T08:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation errors, time conflicts, or provider not available
- `404`: Provider or service not found

**Notes:**
- Time format must be HH:MM (24-hour format)
- Date must be in YYYY-MM-DD format
- Booking starts in PENDING status

### Get All Bookings
**Endpoint:** `GET /bookings`

**Authentication:** Required

**Query Parameters:**
- `status` (string): Filter by status (PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED)
- `date` (string): Filter by date (YYYY-MM-DD format)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "user": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "phone": "string"
      },
      "provider": {
        "_id": "string",
        "user": {
          "name": "string",
          "phone": "string"
        },
        "services": [...],
        "location": {...}
      },
      "serviceKey": "string",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "12:00",
      "price": 1000,
      "status": "PENDING",
      "isRated": false,
      "createdAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Notes:**
- USERs see only their own bookings
- PROVIDERs see bookings for their services
- Sorted by date and start time (descending)

### Get Booking by ID
**Endpoint:** `GET /bookings/:id`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "user": {
      "_id": "string",
      "name": "string",
      "email": "string",
      "phone": "string"
    },
    "provider": {
      "_id": "string",
      "user": {
        "name": "string",
        "phone": "string"
      },
      "services": [...],
      "location": {...}
    },
    "serviceKey": "string",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "price": 1000,
    "status": "PENDING",
    "isRated": false
  }
}
```

**Error Responses:**
- `403`: Not authorized to view this booking
- `404`: Booking not found

**Notes:**
- Users can only view their own bookings
- Providers can view bookings for their services

### Cancel Booking
**Endpoint:** `PATCH /bookings/:id/cancel`

**Authentication:** Required

**Request Body (optional):**
```json
{
  "cancellationReason": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "string",
    "status": "CANCELLED",
    "cancellationReason": "string",
    ...
  }
}
```

**Error Responses:**
- `400`: Invalid booking status for cancellation, or start time has passed
- `403`: Not authorized to cancel this booking
- `404`: Booking not found

**Notes:**
- Only PENDING or APPROVED bookings can be cancelled
- Cannot cancel if start time has already passed
- Automatically restores provider availability for APPROVED bookings

### Complete Booking
**Endpoint:** `PATCH /bookings/:id/complete`

**Authentication:** Required (PROVIDER or ADMIN role)

**Response (200):**
```json
{
  "success": true,
  "message": "Booking completed successfully",
  "data": {
    "_id": "string",
    "status": "COMPLETED",
    ...
  }
}
```

**Error Responses:**
- `400`: Booking not in APPROVED status, or end time not yet passed
- `403`: Not authorized to complete this booking
- `404`: Booking or provider not found

**Notes:**
- Only APPROVED bookings can be completed
- Can only complete after the booking end time has passed
- Only the booking's provider or admin can complete it

---

## Admin Endpoints

All admin endpoints require authentication with ADMIN role.

### Get Admin Dashboard
**Endpoint:** `GET /admin/dashboard`

**Authentication:** Required (ADMIN role)

**Response (200):**
```json
{
  "success": true,
  "message": "Admin dashboard placeholder",
  "data": null
}
```

### Get All Providers (Admin)
**Endpoint:** `GET /admin/providers`

**Authentication:** Required (ADMIN role)

**Query Parameters:**
- `status` (string): Filter by status (PENDING, APPROVED, REJECTED)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "user": {
        "name": "string",
        "phone": "string"
      },
      "services": [...],
      "location": {...},
      "status": "PENDING | APPROVED | REJECTED",
      "rating": 0,
      "isActive": false,
      "experienceYears": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Approve Provider
**Endpoint:** `PATCH /admin/provider/:id/approve`

**Authentication:** Required (ADMIN role)

**Response (200):**
```json
{
  "success": true,
  "message": "Provider approved successfully"
}
```

**Error Responses:**
- `404`: Provider not found

**Notes:**
- Sets provider status to APPROVED
- Sets isActive to true
- Updates user role to PROVIDER

### Reject Provider
**Endpoint:** `PATCH /admin/provider/:id/reject`

**Authentication:** Required (ADMIN role)

**Response (200):**
```json
{
  "success": true,
  "message": "Provider rejected successfully"
}
```

**Error Responses:**
- `404`: Provider not found

**Notes:**
- Sets provider status to REJECTED
- Sets isActive to false

### Suspend Provider
**Endpoint:** `PATCH /admin/provider/:id/suspend`

**Authentication:** Required (ADMIN role)

**Response (200):**
```json
{
  "success": true,
  "message": "Provider suspended successfully"
}
```

**Error Responses:**
- `404`: Provider not found

**Notes:**
- Sets isActive to false
- Does not change provider status

### Get All Bookings (Admin)
**Endpoint:** `GET /admin/bookings`

**Authentication:** Required (ADMIN role)

**Query Parameters:**
- `status` (string): Filter by status (PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED)
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "user": {
        "name": "string",
        "phone": "string"
      },
      "provider": {
        "_id": "string",
        "user": {
          "name": "string",
          "phone": "string"
        }
      },
      "serviceKey": "string",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "12:00",
      "price": 1000,
      "status": "string",
      "createdAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Notes:**
- Returns all bookings across all users and providers
- Supports date range filtering
- Sorted by createdAt descending

---

## Provider Availability Endpoints

### Add Availability Slot
**Endpoint:** `POST /provider/availability`

**Authentication:** Required (PROVIDER role)

**Request Body:**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Response (201):**
```json
{
  "_id": "string",
  "providerId": "string",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "isActive": true
}
```

**Error Responses:**
- `400`: Time conflict with existing bookings
- `403`: Provider not approved

**Notes:**
- dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Time format must be HH:MM (24-hour format)
- Cannot add slots that conflict with approved bookings

### Get My Availability
**Endpoint:** `GET /provider/availability/me`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
[
  {
    "_id": "string",
    "providerId": "string",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true
  }
]
```

### Get Provider Availability (Public)
**Endpoint:** `GET /provider/availability/:id`

**Authentication:** Not required

**Response (200):**
```json
[
  {
    "_id": "string",
    "providerId": "string",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true
  }
]
```

**Notes:**
- Public endpoint to view any provider's availability
- Only returns active slots

### Update Availability Slot
**Endpoint:** `PATCH /provider/availability/:id`

**Authentication:** Required (PROVIDER role)

**Request Body (all fields optional):**
```json
{
  "startTime": "10:00",
  "endTime": "18:00",
  "isActive": false
}
```

**Response (200):**
```json
{
  "_id": "string",
  "providerId": "string",
  "dayOfWeek": 1,
  "startTime": "10:00",
  "endTime": "18:00",
  "isActive": false
}
```

**Error Responses:**
- `400`: Time conflict with existing bookings
- `403`: Not authorized to update this slot
- `404`: Slot not found

### Delete Availability Slot
**Endpoint:** `DELETE /provider/availability/:id`

**Authentication:** Required (PROVIDER role)

**Response (200):**
```json
{
  "message": "Availability removed"
}
```

**Error Responses:**
- `403`: Not authorized to delete this slot
- `404`: Slot not found

---

## Rating Endpoints

### Create Rating
**Endpoint:** `POST /ratings`

**Authentication:** Required

**Request Body:**
```json
{
  "bookingId": "string",
  "rating": 5,
  "review": "Excellent service!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Rating created successfully",
  "data": {
    "_id": "string",
    "booking": "bookingId",
    "user": "userId",
    "provider": "providerId",
    "rating": 5,
    "review": "Excellent service!",
    "createdAt": "2024-01-15T08:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid rating value, booking not completed, or rating already exists
- `403`: Not authorized to rate this booking
- `404`: Booking not found

**Notes:**
- Rating must be between 1 and 5
- Can only rate COMPLETED bookings
- Can only rate your own bookings
- One rating per booking
- Automatically updates provider's average rating

### Get Provider Ratings (Public)
**Endpoint:** `GET /ratings/providers/:id/ratings`

**Authentication:** Not required

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "user": {
        "name": "string"
      },
      "booking": {
        "date": "2024-01-15T00:00:00.000Z",
        "serviceKey": "string"
      },
      "rating": 5,
      "review": "Excellent service!",
      "createdAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Error Responses:**
- `404`: Provider not found

**Notes:**
- Public endpoint, no authentication required
- Sorted by createdAt descending (newest first)

---

## Data Models

### User Model
```json
{
  "_id": "ObjectId",
  "name": "string",
  "role": "USER | PROVIDER | ADMIN",
  "profile_pic": "string",
  "location": "string",
  "bio": "string",
  "phone": "string",
  "email": "string",
  "authProvider": "firebase | local",
  "isPhoneVerified": true,
  "created_at": "Date"
}
```

### Provider Model
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "religion": "string",
  "services": [
    {
      "key": "string",
      "name": "string",
      "price": 1000,
      "duration": 60,
      "description": "string"
    }
  ],
  "docs": "string",
  "location": {
    "city": "string",
    "lat": "string",
    "long": "string",
    "geo": {
      "type": "Point",
      "coordinates": [longitude, latitude]
    }
  },
  "experienceYears": 5,
  "status": "PENDING | APPROVED | REJECTED",
  "rating": 4.5,
  "isActive": true,
  "bio": "string"
}
```

### Booking Model
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)",
  "provider": "ObjectId (ref: Provider)",
  "serviceKey": "string",
  "date": "Date (midnight UTC)",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "price": 1000,
  "status": "PENDING | APPROVED | REJECTED | CANCELLED | COMPLETED",
  "cancellationReason": "string",
  "isRated": false,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Rating Model
```json
{
  "_id": "ObjectId",
  "booking": "ObjectId (ref: Booking)",
  "user": "ObjectId (ref: User)",
  "provider": "ObjectId (ref: Provider)",
  "rating": 5,
  "review": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Provider Availability Model
```json
{
  "_id": "ObjectId",
  "providerId": "ObjectId (ref: Provider)",
  "dayOfWeek": 1,
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "isActive": true
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error message describing the validation issue"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: You do not have permission"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Authentication Flow

1. **Firebase Authentication:**
   - User signs up/logs in via Firebase (phone authentication)
   - Firebase returns an ID token
   - Send ID token to `POST /auth/firebase-login`
   - Receive JWT token in response

2. **Using JWT Token:**
   - Include token in all subsequent requests
   - Header format: `Authorization: Bearer <JWT_TOKEN>`
   - Token contains user information and role

3. **Role-Based Access:**
   - **USER**: Can create bookings, view their bookings, rate services
   - **PROVIDER**: All USER permissions + manage provider profile, handle bookings, manage availability
   - **ADMIN**: Full access to all endpoints, manage providers and bookings

---

## Booking Workflow

1. **User searches for providers** (`GET /providers`)
2. **User views provider details** (`GET /providers/:id`)
3. **User checks provider availability** (`GET /provider/availability/:id`)
4. **User creates a booking** (`POST /bookings`)
   - Status: PENDING
5. **Provider views booking** (`GET /providers/bookings`)
6. **Provider approves/rejects booking** (`PATCH /providers/bookings/:id/approve` or `reject`)
   - Status: APPROVED or REJECTED
7. **Service is performed**
8. **Provider marks as complete** (`PATCH /bookings/:id/complete`)
   - Status: COMPLETED
9. **User rates the service** (`POST /ratings`)

### Alternative Flow: Cancellation
- User can cancel at any time before start time (`PATCH /bookings/:id/cancel`)
  - Status: CANCELLED

---

## Provider Onboarding Workflow

1. **User logs in** (`POST /auth/firebase-login`)
2. **User applies as provider** (`POST /providers/apply`)
   - Status: PENDING
3. **Admin reviews application** (`GET /admin/providers`)
4. **Admin approves/rejects** (`PATCH /admin/provider/:id/approve` or `reject`)
   - Status: APPROVED or REJECTED
5. **Provider adds availability** (`POST /provider/availability`)
6. **Provider activates profile** (`PATCH /providers/me/active`)
7. **Provider is now visible in search** (`GET /providers`)

---

## Query Parameter Examples

### Filter by Status
```
GET /bookings?status=APPROVED
GET /admin/providers?status=PENDING
```

### Pagination
```
GET /bookings?page=2&limit=20
GET /ratings/providers/123/ratings?page=1&limit=5
```

### Date Filtering
```
GET /bookings?date=2024-01-15
GET /admin/bookings?startDate=2024-01-01&endDate=2024-01-31
```

### Location-Based Search
```
GET /providers?city=Mumbai
GET /providers?lat=19.0760&long=72.8777&radius=10
```

### Service Filtering
```
GET /providers?service=puja_service
GET /providers?serviceType=havan
```

---

## Notes and Best Practices

1. **Time Format:**
   - Always use 24-hour format (HH:MM)
   - Example: "09:00", "14:30", "23:45"

2. **Date Format:**
   - Use ISO date format (YYYY-MM-DD) for input
   - API returns dates in ISO 8601 format

3. **Day of Week:**
   - 0 = Sunday
   - 1 = Monday
   - 2 = Tuesday
   - 3 = Wednesday
   - 4 = Thursday
   - 5 = Friday
   - 6 = Saturday

4. **Service Keys:**
   - Automatically normalized from service names
   - Spaces replaced with underscores
   - Converted to lowercase
   - Example: "Puja Service" → "puja_service"

5. **Geo Coordinates:**
   - Format: [longitude, latitude]
   - Used for distance-based searches
   - Stored as GeoJSON Point

6. **Pagination:**
   - Default page size: 10 items
   - Always check `pagination.pages` for total pages
   - Use `pagination.total` for total item count

7. **Rating Calculation:**
   - Provider rating is automatically calculated as average
   - Updated when new ratings are added
   - Stored on Provider model for quick access

8. **Booking Status Flow:**
   ```
   PENDING → APPROVED → COMPLETED
   PENDING → REJECTED
   PENDING/APPROVED → CANCELLED
   ```

9. **Provider Status Flow:**
   ```
   PENDING → APPROVED (isActive can be toggled)
   PENDING → REJECTED (cannot become active)
   APPROVED → SUSPENDED (isActive = false, status unchanged)
   ```

---

## Quick Reference

### Public Endpoints (No Auth Required)
- `POST /auth/firebase-login`
- `GET /users`
- `GET /providers`
- `GET /providers/:id`
- `GET /provider/availability/:id`
- `GET /ratings/providers/:id/ratings`

### User Endpoints (USER role)
- `GET /users/me`
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id/cancel`
- `POST /ratings`

### Provider Endpoints (PROVIDER role)
- All USER endpoints +
- `POST /providers/apply`
- `GET /providers/me`
- `PATCH /providers/me`
- `PATCH /providers/me/active`
- `GET /providers/bookings`
- `PATCH /providers/bookings/:id/approve`
- `PATCH /providers/bookings/:id/reject`
- `POST /provider/availability`
- `GET /provider/availability/me`
- `PATCH /provider/availability/:id`
- `DELETE /provider/availability/:id`
- `PATCH /bookings/:id/complete`

### Admin Endpoints (ADMIN role)
- `GET /admin/dashboard`
- `GET /admin/providers`
- `PATCH /admin/provider/:id/approve`
- `PATCH /admin/provider/:id/reject`
- `PATCH /admin/provider/:id/suspend`
- `GET /admin/bookings`
- `PATCH /bookings/:id/complete`

---

## Support

For any questions or issues with the API, please refer to this documentation or contact the development team.
