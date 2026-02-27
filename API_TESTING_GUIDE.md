# API Testing Guide

## Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:

```
base_url: http://localhost:3000/api
token: (will be set after login)
user_id: (will be set after login)
provider_id: (will be set after provider creation)
booking_id: (will be set after booking creation)
```

---

## Test Sequence

### 1. Authentication & User Setup

#### Test 1.1: Firebase Login
```
POST {{base_url}}/auth/firebase-login
Content-Type: application/json

{
  "idToken": "YOUR_FIREBASE_ID_TOKEN"
}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.token).to.exist;
    pm.environment.set("token", jsonData.data.token);
});

pm.test("Response has user", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.user).to.exist;
    pm.environment.set("user_id", jsonData.data.user._id);
});
```

#### Test 1.2: Get Current User Profile
```
GET {{base_url}}/users/me
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("User data is returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.exist;
    pm.expect(jsonData.data.name).to.exist;
});
```

---

### 2. Provider Operations

#### Test 2.1: Apply as Provider
```
POST {{base_url}}/providers/apply
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "services": [
    {
      "name": "Traditional Puja",
      "key": "traditional_puja",
      "price": 1500,
      "duration": 90,
      "description": "Complete traditional puja ceremony"
    },
    {
      "name": "Havan Ceremony",
      "key": "havan_ceremony",
      "price": 2500,
      "duration": 120,
      "description": "Sacred fire ceremony"
    }
  ],
  "location": {
    "city": "Mumbai",
    "lat": "19.0760",
    "long": "72.8777"
  },
  "experienceYears": 5
}

Tests:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Provider application created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.provider).to.exist;
    pm.expect(jsonData.provider.status).to.eql("PENDING");
    pm.environment.set("provider_id", jsonData.provider._id);
});
```

#### Test 2.2: Get My Provider Profile
```
GET {{base_url}}/providers/me
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Provider profile exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData._id).to.exist;
    pm.expect(jsonData.services).to.be.an('array');
});
```

#### Test 2.3: Update Provider Profile
```
PATCH {{base_url}}/providers/me
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "bio": "Experienced pujari with 5+ years of conducting traditional ceremonies",
  "experienceYears": 6
}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Profile updated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.bio).to.exist;
});
```

#### Test 2.4: List Providers (Public)
```
GET {{base_url}}/providers?service=traditional_puja&city=Mumbai

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns array of providers", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});

pm.test("Providers have required fields", function () {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        pm.expect(jsonData[0].providerId).to.exist;
        pm.expect(jsonData[0].services).to.be.an('array');
    }
});
```

#### Test 2.5: Get Provider Details (Public)
```
GET {{base_url}}/providers/{{provider_id}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Provider details complete", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.providerId).to.exist;
    pm.expect(jsonData.services).to.be.an('array');
    pm.expect(jsonData.availability).to.be.an('array');
});
```

---

### 3. Provider Availability

#### Test 3.1: Add Availability Slot
```
POST {{base_url}}/provider/availability
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}

Tests:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Availability created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData._id).to.exist;
    pm.environment.set("availability_id", jsonData._id);
});
```

#### Test 3.2: Get My Availability
```
GET {{base_url}}/provider/availability/me
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns availability array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});
```

#### Test 3.3: Update Availability Slot
```
PATCH {{base_url}}/provider/availability/{{availability_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "startTime": "10:00",
  "endTime": "18:00"
}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

#### Test 3.4: Get Provider Availability (Public)
```
GET {{base_url}}/provider/availability/{{provider_id}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns availability array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});
```

---

### 4. Booking Operations

#### Test 4.1: Create Booking
```
POST {{base_url}}/bookings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "providerId": "{{provider_id}}",
  "serviceKey": "traditional_puja",
  "date": "2024-02-15",
  "startTime": "10:00",
  "endTime": "11:30"
}

Tests:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Booking created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data._id).to.exist;
    pm.expect(jsonData.data.status).to.eql("PENDING");
    pm.environment.set("booking_id", jsonData.data._id);
});
```

#### Test 4.2: Get All Bookings
```
GET {{base_url}}/bookings?page=1&limit=10
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.pagination).to.exist;
    pm.expect(jsonData.pagination.page).to.exist;
    pm.expect(jsonData.pagination.total).to.exist;
});

pm.test("Data is array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

#### Test 4.3: Get Booking by ID
```
GET {{base_url}}/bookings/{{booking_id}}
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Booking details complete", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data._id).to.eql(pm.environment.get("booking_id"));
    pm.expect(jsonData.data.user).to.exist;
    pm.expect(jsonData.data.provider).to.exist;
});
```

#### Test 4.4: Get Bookings with Status Filter
```
GET {{base_url}}/bookings?status=PENDING
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All bookings have correct status", function () {
    var jsonData = pm.response.json();
    jsonData.data.forEach(function(booking) {
        pm.expect(booking.status).to.eql("PENDING");
    });
});
```

#### Test 4.5: Get Provider Bookings
```
GET {{base_url}}/providers/bookings
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns bookings array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

#### Test 4.6: Approve Booking (Provider)
```
PATCH {{base_url}}/providers/bookings/{{booking_id}}/approve
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Booking approved", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("APPROVED");
});
```

#### Test 4.7: Cancel Booking (User)
```
PATCH {{base_url}}/bookings/{{booking_id}}/cancel
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "cancellationReason": "Schedule changed"
}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Booking cancelled", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("CANCELLED");
    pm.expect(jsonData.data.cancellationReason).to.exist;
});
```

#### Test 4.8: Complete Booking (Provider)
```
PATCH {{base_url}}/bookings/{{booking_id}}/complete
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Booking completed", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("COMPLETED");
});
```

---

### 5. Ratings

#### Test 5.1: Create Rating
```
POST {{base_url}}/ratings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "bookingId": "{{booking_id}}",
  "rating": 5,
  "review": "Excellent service! Very professional and knowledgeable."
}

Tests:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Rating created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data._id).to.exist;
    pm.expect(jsonData.data.rating).to.eql(5);
    pm.environment.set("rating_id", jsonData.data._id);
});
```

#### Test 5.2: Get Provider Ratings
```
GET {{base_url}}/ratings/providers/{{provider_id}}/ratings?page=1&limit=10

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has ratings and pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    pm.expect(jsonData.pagination).to.exist;
});

pm.test("Ratings have required fields", function () {
    var jsonData = pm.response.json();
    if (jsonData.data.length > 0) {
        pm.expect(jsonData.data[0].rating).to.exist;
        pm.expect(jsonData.data[0].user).to.exist;
    }
});
```

---

### 6. Admin Operations

#### Test 6.1: Get All Providers (Admin)
```
GET {{base_url}}/admin/providers?status=PENDING&page=1&limit=10
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response structure correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    pm.expect(jsonData.pagination).to.exist;
});
```

#### Test 6.2: Approve Provider (Admin)
```
PATCH {{base_url}}/admin/provider/{{provider_id}}/approve
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Provider approved", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("approved");
});
```

#### Test 6.3: Reject Provider (Admin)
```
PATCH {{base_url}}/admin/provider/{{provider_id}}/reject
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

#### Test 6.4: Suspend Provider (Admin)
```
PATCH {{base_url}}/admin/provider/{{provider_id}}/suspend
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

#### Test 6.5: Get All Bookings (Admin)
```
GET {{base_url}}/admin/bookings?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data and pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    pm.expect(jsonData.pagination).to.exist;
});
```

---

## Error Cases to Test

### Test E1: Invalid Token
```
GET {{base_url}}/users/me
Authorization: Bearer invalid_token

Expected: 401 Unauthorized
```

### Test E2: Missing Required Fields
```
POST {{base_url}}/bookings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "providerId": "{{provider_id}}"
  // Missing other required fields
}

Expected: 400 Bad Request
```

### Test E3: Invalid Booking Time
```
POST {{base_url}}/bookings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "providerId": "{{provider_id}}",
  "serviceKey": "traditional_puja",
  "date": "2024-02-15",
  "startTime": "25:00",  // Invalid time
  "endTime": "11:30"
}

Expected: 400 Bad Request
```

### Test E4: Past Date Booking
```
POST {{base_url}}/bookings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "providerId": "{{provider_id}}",
  "serviceKey": "traditional_puja",
  "date": "2020-01-01",  // Past date
  "startTime": "10:00",
  "endTime": "11:30"
}

Expected: 400 Bad Request
```

### Test E5: Unauthorized Access
```
PATCH {{base_url}}/admin/provider/{{provider_id}}/approve
Authorization: Bearer {{user_token}}  // Non-admin token

Expected: 403 Forbidden
```

### Test E6: Resource Not Found
```
GET {{base_url}}/bookings/invalid_id
Authorization: Bearer {{token}}

Expected: 404 Not Found
```

### Test E7: Duplicate Rating
```
POST {{base_url}}/ratings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "bookingId": "{{booking_id}}",  // Already rated
  "rating": 5
}

Expected: 400 Bad Request - "Rating already exists"
```

### Test E8: Cancel Already Cancelled Booking
```
PATCH {{base_url}}/bookings/{{cancelled_booking_id}}/cancel
Authorization: Bearer {{token}}

Expected: 400 Bad Request
```

---

## Load Testing with Postman

### Collection Runner Settings
1. Run the collection with multiple iterations
2. Add delays between requests (500ms recommended)
3. Monitor response times
4. Check for consistent status codes

### Performance Benchmarks
- List endpoints: < 200ms
- Detail endpoints: < 100ms
- Create/Update operations: < 300ms
- With pagination: < 250ms

---

## cURL Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/firebase-login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_FIREBASE_TOKEN"}'
```

### List Providers
```bash
curl -X GET "http://localhost:3000/api/providers?service=puja&city=Mumbai"
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "PROVIDER_ID",
    "serviceKey": "traditional_puja",
    "date": "2024-02-15",
    "startTime": "10:00",
    "endTime": "11:30"
  }'
```

### Get Bookings with Filters
```bash
curl -X GET "http://localhost:3000/api/bookings?status=APPROVED&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Automated Testing Script (Node.js)

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let providerId = '';
let bookingId = '';

async function runTests() {
  try {
    // Test 1: Login
    console.log('Test 1: Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/firebase-login`, {
      idToken: 'YOUR_FIREBASE_TOKEN'
    });
    token = loginRes.data.data.token;
    console.log('✓ Login successful');

    // Setup axios with auth
    const api = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });

    // Test 2: Get Profile
    console.log('Test 2: Get Profile...');
    await api.get('/users/me');
    console.log('✓ Profile retrieved');

    // Test 3: List Providers
    console.log('Test 3: List Providers...');
    const providersRes = await axios.get(`${BASE_URL}/providers?city=Mumbai`);
    if (providersRes.data.length > 0) {
      providerId = providersRes.data[0].providerId;
    }
    console.log('✓ Providers listed');

    // Test 4: Create Booking
    console.log('Test 4: Create Booking...');
    const bookingRes = await api.post('/bookings', {
      providerId,
      serviceKey: 'traditional_puja',
      date: '2024-02-15',
      startTime: '10:00',
      endTime: '11:30'
    });
    bookingId = bookingRes.data.data._id;
    console.log('✓ Booking created');

    // Test 5: Get Bookings
    console.log('Test 5: Get Bookings...');
    await api.get('/bookings');
    console.log('✓ Bookings retrieved');

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
  }
}

runTests();
```

---

## Integration Test Checklist

- [ ] User can register/login via Firebase
- [ ] User can view their profile
- [ ] User can search for providers
- [ ] User can view provider details and availability
- [ ] User can create a booking
- [ ] User can view their bookings
- [ ] User can cancel a booking
- [ ] User can rate a completed service
- [ ] Provider can apply for provider status
- [ ] Provider can update their profile
- [ ] Provider can add/update/delete availability
- [ ] Provider can view their bookings
- [ ] Provider can approve/reject bookings
- [ ] Provider can mark bookings as complete
- [ ] Admin can view all providers
- [ ] Admin can approve/reject provider applications
- [ ] Admin can suspend providers
- [ ] Admin can view all bookings
- [ ] Pagination works correctly
- [ ] Filters work correctly
- [ ] Error handling is consistent
- [ ] Authentication is enforced
- [ ] Role-based access control works

---

## Notes

1. **Token Expiration**: JWT tokens may expire. Handle 401 responses by refreshing the token or re-authenticating.

2. **Date/Time Format**: Always use ISO format for dates (YYYY-MM-DD) and 24-hour format for times (HH:MM).

3. **IDs**: All IDs are MongoDB ObjectIds (24 character hex strings).

4. **Pagination**: Default page size is 10. Always check `pagination.pages` before requesting next page.

5. **Rate Limiting**: Be mindful of rate limits when running automated tests.

6. **Test Data**: Use test data that won't interfere with production. Consider using a separate test database.

---

For complete API specifications, refer to `API_DOCUMENTATION.md`.
