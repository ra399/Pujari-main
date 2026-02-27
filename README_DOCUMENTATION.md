# Pujari API - Documentation Index

Welcome to the Pujari API documentation! This guide will help you navigate through the comprehensive documentation created for building your frontend application.

## 📚 Documentation Files

### 1. **API_DOCUMENTATION.md** - Complete API Reference
**Best for:** Understanding the complete API structure and endpoints

**Contents:**
- Complete list of all API endpoints
- Request/response formats for each endpoint
- Authentication and authorization details
- Data models and schemas
- Error responses
- Query parameters and filtering
- Common workflows (booking flow, provider onboarding)
- Role-based access control

**When to use:** Reference this when you need detailed information about any endpoint, including request bodies, response structures, and error handling.

---

### 2. **FRONTEND_QUICK_REFERENCE.md** - Developer Quick Start
**Best for:** Frontend developers implementing API calls

**Contents:**
- Ready-to-use JavaScript/TypeScript code examples
- Common use cases with complete implementations
- React hooks and context examples
- Helper functions for formatting and validation
- UI component examples
- Error handling patterns
- Performance tips and best practices

**When to use:** Copy-paste code examples while building your frontend. Contains practical implementations for React/JavaScript applications.

---

### 3. **API_TESTING_GUIDE.md** - Testing & QA Reference
**Best for:** Testing APIs and ensuring functionality

**Contents:**
- Postman collection test cases
- Complete test sequence covering all endpoints
- Error case testing scenarios
- cURL command examples
- Automated testing scripts
- Load testing guidelines
- Integration test checklist

**When to use:** Setting up Postman collections, writing automated tests, or verifying API functionality during development.

---

## 🚀 Quick Start Guide

### For Frontend Developers

1. **Start Here:** Read the [Getting Started](#getting-started-for-frontend-developers) section below
2. **Next:** Browse `FRONTEND_QUICK_REFERENCE.md` for code examples
3. **Reference:** Keep `API_DOCUMENTATION.md` open while coding
4. **Test:** Use `API_TESTING_GUIDE.md` to test your implementations

### For Backend Developers

1. **Start Here:** Review `API_DOCUMENTATION.md` to understand all endpoints
2. **Test:** Use `API_TESTING_GUIDE.md` to verify functionality
3. **Share:** Give `FRONTEND_QUICK_REFERENCE.md` to frontend team

### For QA/Testers

1. **Start Here:** Open `API_TESTING_GUIDE.md`
2. **Setup:** Create Postman collection from test cases
3. **Reference:** Use `API_DOCUMENTATION.md` for expected behaviors
4. **Checklist:** Follow the integration test checklist

---

## 🎯 Getting Started for Frontend Developers

### Step 1: Setup Your Environment

```javascript
// config.js
export const API_BASE_URL = 'http://localhost:3000/api';

// api.js
import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 2: Implement Authentication

```javascript
// auth.js
import axios from 'axios';
import { API_BASE_URL } from './config';

export async function login(firebaseIdToken) {
  const response = await axios.post(`${API_BASE_URL}/auth/firebase-login`, {
    idToken: firebaseIdToken
  });
  
  const { token, user } = response.data.data;
  
  // Store for future use
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return { token, user };
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}
```

### Step 3: Start Building Features

Now you're ready! Check `FRONTEND_QUICK_REFERENCE.md` for specific feature implementations.

---

## 📋 Common Workflows

### Workflow 1: User Books a Service

1. **Search Providers** → `GET /providers?service=puja&city=Mumbai`
2. **View Provider Details** → `GET /providers/:id`
3. **Check Availability** → (included in provider details)
4. **Create Booking** → `POST /bookings`
5. **Track Booking** → `GET /bookings/:id`
6. **After Service** → `POST /ratings`

**Code Examples:** See `FRONTEND_QUICK_REFERENCE.md` sections 2, 3, 4, 7

---

### Workflow 2: Provider Onboarding

1. **User Signs Up** → `POST /auth/firebase-login`
2. **Apply as Provider** → `POST /providers/apply`
3. **Admin Approves** → `PATCH /admin/provider/:id/approve`
4. **Provider Adds Availability** → `POST /provider/availability`
5. **Provider Goes Live** → `PATCH /providers/me/active`

**Code Examples:** See `FRONTEND_QUICK_REFERENCE.md` sections 10, 11

---

### Workflow 3: Handling a Booking (Provider Side)

1. **View Bookings** → `GET /providers/bookings`
2. **Review Request** → Check booking details
3. **Approve/Reject** → `PATCH /providers/bookings/:id/approve` or `reject`
4. **Perform Service** → (offline)
5. **Mark Complete** → `PATCH /bookings/:id/complete`

**Code Examples:** See `FRONTEND_QUICK_REFERENCE.md` sections 8, 9

---

## 🔑 Key Concepts

### Authentication
- Uses Firebase for initial authentication
- Returns JWT token for API access
- Token must be included in `Authorization: Bearer <token>` header
- Token contains user role (USER, PROVIDER, ADMIN)

### Roles & Permissions
- **USER**: Can search, book services, rate providers
- **PROVIDER**: All USER permissions + manage profile, bookings, availability
- **ADMIN**: Full access to manage providers and view all bookings

### Booking Status Flow
```
PENDING → APPROVED → COMPLETED
   ↓          ↓
REJECTED   CANCELLED
```

### Provider Status Flow
```
PENDING → APPROVED (can toggle isActive)
   ↓
REJECTED (cannot become active)
```

### Time Format
- **Times**: 24-hour format (HH:MM) - e.g., "14:30"
- **Dates**: ISO format (YYYY-MM-DD) - e.g., "2024-01-15"
- **Day of Week**: 0 = Sunday, 1 = Monday, ..., 6 = Saturday

---

## 📊 API Endpoint Categories

### Public Endpoints (No Auth Required)
- Authentication endpoints
- Provider search and listing
- Provider details and availability
- Provider ratings

### User Endpoints
- Profile management
- Booking creation and management
- Service rating

### Provider Endpoints
- Provider application and profile
- Availability management
- Booking approval/rejection
- Service completion

### Admin Endpoints
- Provider approval/rejection
- System-wide booking management
- Provider suspension

**Full list:** See `API_DOCUMENTATION.md` - Quick Reference section

---

## 🎨 Frontend Pages Needed

Based on the API, you'll likely need these pages:

### Public Pages
- [ ] Home / Landing Page
- [ ] Provider Search Page
- [ ] Provider Profile Page
- [ ] Login / Signup Page

### User Dashboard
- [ ] My Profile
- [ ] Search Providers
- [ ] Book Service
- [ ] My Bookings
- [ ] Booking Details
- [ ] Rate Service

### Provider Dashboard
- [ ] Apply as Provider
- [ ] My Provider Profile
- [ ] Edit Profile
- [ ] Manage Availability
- [ ] Incoming Bookings
- [ ] Booking Management
- [ ] My Statistics

### Admin Dashboard
- [ ] Overview
- [ ] Provider Applications
- [ ] All Bookings
- [ ] Provider Management
- [ ] System Statistics

---

## 🔍 Finding Information Quickly

### "How do I...?"

| Question | Document | Section |
|----------|----------|---------|
| Login a user? | FRONTEND_QUICK_REFERENCE.md | Section 1 |
| Search for providers? | FRONTEND_QUICK_REFERENCE.md | Section 2 |
| Create a booking? | FRONTEND_QUICK_REFERENCE.md | Section 4 |
| Handle errors? | FRONTEND_QUICK_REFERENCE.md | Error Handling |
| Test an endpoint? | API_TESTING_GUIDE.md | Test Sequence |
| Understand request format? | API_DOCUMENTATION.md | Endpoint Details |
| See available filters? | API_DOCUMENTATION.md | Query Parameters |
| Know booking workflow? | API_DOCUMENTATION.md | Booking Workflow |

---

## 🛠️ Tools Recommended

### Development
- **Axios**: HTTP client (examples provided)
- **React Query**: Data fetching & caching
- **React Hook Form**: Form management
- **Zod** or **Yup**: Schema validation

### Testing
- **Postman**: API testing (setup guide in API_TESTING_GUIDE.md)
- **Jest**: Unit testing
- **React Testing Library**: Component testing

### Date/Time
- **date-fns** or **dayjs**: Date manipulation
- **react-datepicker**: Date picker component

### UI
- **Tailwind CSS**: Styling (examples provided)
- **React Toastify**: Notifications
- **React Loading Skeleton**: Loading states

---

## 📝 Common Patterns

### Pagination Pattern
```javascript
const [page, setPage] = useState(1);
const [data, setData] = useState([]);
const [pagination, setPagination] = useState(null);

useEffect(() => {
  async function fetchData() {
    const response = await api.get(`/bookings?page=${page}&limit=10`);
    setData(response.data.data);
    setPagination(response.data.pagination);
  }
  fetchData();
}, [page]);
```

### Filter Pattern
```javascript
const [filters, setFilters] = useState({
  status: '',
  date: '',
  city: ''
});

const queryString = new URLSearchParams(
  Object.entries(filters).filter(([_, v]) => v)
).toString();

const response = await api.get(`/bookings?${queryString}`);
```

### Protected Route Pattern
```javascript
function ProtectedRoute({ children, requiredRole }) {
  const user = getCurrentUser();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

More patterns in `FRONTEND_QUICK_REFERENCE.md`

---

## ⚠️ Important Notes

1. **Always handle 401 errors** - Token may expire, redirect to login
2. **Validate dates on frontend** - Don't allow past date bookings
3. **Show loading states** - API calls take time
4. **Implement pagination** - Don't load all data at once
5. **Cache provider data** - Provider details don't change often
6. **Debounce search inputs** - Reduce API calls
7. **Show clear error messages** - Use error responses from API
8. **Test with different roles** - Each role sees different data
9. **Handle timezone properly** - Use consistent timezone for bookings
10. **Validate forms** - Check data before sending to API

---

## 🐛 Troubleshooting

### Common Issues

**Issue: 401 Unauthorized**
- Solution: Check if token is being sent in header
- Check if token is expired (re-login required)

**Issue: 403 Forbidden**
- Solution: Check user role vs endpoint requirements
- User may not have permission for this action

**Issue: 400 Bad Request**
- Solution: Check request body format against documentation
- Validate required fields are present
- Check date/time format

**Issue: CORS errors**
- Solution: Configure CORS on backend
- Check API_BASE_URL is correct

**Issue: Bookings not showing**
- Solution: Check user role - USERs see their bookings, PROVIDERs see their service bookings

---

## 📞 Support

If you can't find what you're looking for:

1. Check the **Table of Contents** in each documentation file
2. Use **Ctrl+F** (Cmd+F) to search within documents
3. Review **Common Workflows** section above
4. Check **Examples** in FRONTEND_QUICK_REFERENCE.md

---

## 📄 Document Summary

| Document | Size | Best Use Case |
|----------|------|---------------|
| API_DOCUMENTATION.md | ~1200 lines | Complete API reference |
| FRONTEND_QUICK_REFERENCE.md | ~800 lines | Code examples & patterns |
| API_TESTING_GUIDE.md | ~900 lines | Testing & QA |
| README_DOCUMENTATION.md | This file | Navigation & overview |

---

## ✅ Next Steps

1. **Review** this README completely
2. **Bookmark** all documentation files
3. **Setup** your development environment using code in this file
4. **Start** building with FRONTEND_QUICK_REFERENCE.md examples
5. **Reference** API_DOCUMENTATION.md as needed
6. **Test** using API_TESTING_GUIDE.md

---

## 🎓 Learning Path

### Day 1: Foundation
- [ ] Read this README completely
- [ ] Understand authentication flow
- [ ] Setup development environment
- [ ] Test login endpoint

### Day 2: Core Features
- [ ] Implement user authentication
- [ ] Build provider search
- [ ] Create provider detail view

### Day 3: Booking System
- [ ] Implement booking creation
- [ ] Build booking list view
- [ ] Add booking status management

### Day 4: Provider Features
- [ ] Build provider application form
- [ ] Implement availability management
- [ ] Create provider dashboard

### Day 5: Additional Features
- [ ] Add rating system
- [ ] Implement filters and search
- [ ] Add pagination

### Day 6: Polish
- [ ] Add error handling
- [ ] Implement loading states
- [ ] Add form validations

### Day 7: Testing
- [ ] Test all user flows
- [ ] Test different roles
- [ ] Fix bugs and edge cases

---

## 🌟 Tips for Success

1. **Start Simple**: Build basic features first, add complexity later
2. **Test Often**: Test each feature as you build it
3. **Use Examples**: Copy-paste from FRONTEND_QUICK_REFERENCE.md
4. **Handle Errors**: Always implement error handling
5. **Think Mobile**: Design mobile-first
6. **Ask Questions**: Refer to documentation frequently
7. **Stay Organized**: Keep code modular and reusable

---

Happy coding! 🚀
