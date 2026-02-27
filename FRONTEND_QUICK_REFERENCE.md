# Frontend Quick Reference Guide

## Getting Started

### Base Configuration
```javascript
const API_BASE_URL = 'http://localhost:PORT/api';
```

### Setting Up Authentication
```javascript
// Store JWT token after login
localStorage.setItem('token', jwtToken);

// Create axios instance with auth
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Common Use Cases

### 1. User Login Flow

```javascript
// After Firebase authentication
async function loginWithFirebase(firebaseIdToken) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/firebase-login`, {
      idToken: firebaseIdToken
    });
    
    const { token, user } = response.data.data;
    
    // Store token for future requests
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message);
    throw error;
  }
}
```

### 2. Search Providers

```javascript
// Basic search
async function searchProviders(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.service) params.append('service', filters.service);
    if (filters.city) params.append('city', filters.city);
    if (filters.lat && filters.long && filters.radius) {
      params.append('lat', filters.lat);
      params.append('long', filters.long);
      params.append('radius', filters.radius);
    }
    
    const response = await axios.get(`${API_BASE_URL}/providers?${params}`);
    return response.data; // Array of providers
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

// Example usage
const providers = await searchProviders({
  service: 'puja_service',
  city: 'Mumbai'
});

// Location-based search
const nearbyProviders = await searchProviders({
  lat: 19.0760,
  long: 72.8777,
  radius: 10 // 10 km radius
});
```

### 3. Get Provider Details

```javascript
async function getProviderDetails(providerId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/providers/${providerId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch provider:', error);
    throw error;
  }
}

// Response structure
/*
{
  providerId: "123",
  name: "John Doe",
  bio: "Experienced provider",
  experienceYears: 5,
  rating: 4.5,
  location: { city: "Mumbai" },
  services: [
    { name: "Puja Service", key: "puja_service", price: 1000 }
  ],
  availability: [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }
  ]
}
*/
```

### 4. Create a Booking

```javascript
async function createBooking(bookingData) {
  try {
    const response = await api.post('/bookings', {
      providerId: bookingData.providerId,
      serviceKey: bookingData.serviceKey,
      date: bookingData.date, // "2024-01-15"
      startTime: bookingData.startTime, // "10:00"
      endTime: bookingData.endTime // "12:00"
    });
    
    return response.data.data; // Booking object
  } catch (error) {
    console.error('Booking failed:', error.response?.data?.message);
    throw error;
  }
}

// Example usage
const booking = await createBooking({
  providerId: "123",
  serviceKey: "puja_service",
  date: "2024-01-15",
  startTime: "10:00",
  endTime: "12:00"
});
```

### 5. Get User's Bookings

```javascript
async function getUserBookings(filters = {}) {
  try {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 10
    });
    
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    
    const response = await api.get(`/bookings?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
}

// Example: Get all approved bookings
const approvedBookings = await getUserBookings({ status: 'APPROVED' });

// Response structure
/*
{
  success: true,
  data: [...bookings],
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    pages: 3
  }
}
*/
```

### 6. Cancel Booking

```javascript
async function cancelBooking(bookingId, reason = '') {
  try {
    const response = await api.patch(`/bookings/${bookingId}/cancel`, {
      cancellationReason: reason
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Cancellation failed:', error.response?.data?.message);
    throw error;
  }
}
```

### 7. Rate a Service

```javascript
async function rateService(bookingId, rating, review = '') {
  try {
    const response = await api.post('/ratings', {
      bookingId,
      rating, // 1-5
      review
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Rating failed:', error.response?.data?.message);
    throw error;
  }
}

// Example usage
await rateService("booking123", 5, "Excellent service!");
```

### 8. Provider: Get Bookings

```javascript
async function getProviderBookings() {
  try {
    const response = await api.get('/providers/bookings');
    return response.data.data; // Array of bookings
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
}
```

### 9. Provider: Approve/Reject Booking

```javascript
async function approveBooking(bookingId) {
  try {
    const response = await api.patch(`/providers/bookings/${bookingId}/approve`);
    return response.data.data;
  } catch (error) {
    console.error('Approval failed:', error.response?.data?.message);
    throw error;
  }
}

async function rejectBooking(bookingId) {
  try {
    const response = await api.patch(`/providers/bookings/${bookingId}/reject`);
    return response.data.data;
  } catch (error) {
    console.error('Rejection failed:', error.response?.data?.message);
    throw error;
  }
}
```

### 10. Provider: Apply as Provider

```javascript
async function applyAsProvider(providerData) {
  try {
    const response = await api.post('/providers/apply', {
      services: providerData.services, // Array of service objects
      location: {
        city: providerData.city,
        lat: providerData.lat,
        long: providerData.long
      },
      experienceYears: providerData.experienceYears
    });
    
    return response.data.provider;
  } catch (error) {
    console.error('Application failed:', error.response?.data?.message);
    throw error;
  }
}

// Example usage
await applyAsProvider({
  services: [
    {
      name: "Puja Service",
      key: "puja_service", // Optional, auto-generated if not provided
      price: 1000,
      duration: 60,
      description: "Traditional puja service"
    }
  ],
  city: "Mumbai",
  lat: "19.0760",
  long: "72.8777",
  experienceYears: 5
});
```

### 11. Provider: Manage Availability

```javascript
// Add availability slot
async function addAvailability(dayOfWeek, startTime, endTime) {
  try {
    const response = await api.post('/provider/availability', {
      dayOfWeek, // 0 = Sunday, 1 = Monday, etc.
      startTime, // "09:00"
      endTime // "17:00"
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to add availability:', error.response?.data?.message);
    throw error;
  }
}

// Get my availability
async function getMyAvailability() {
  try {
    const response = await api.get('/provider/availability/me');
    return response.data; // Array of availability slots
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    throw error;
  }
}

// Update availability
async function updateAvailability(slotId, updates) {
  try {
    const response = await api.patch(`/provider/availability/${slotId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update availability:', error.response?.data?.message);
    throw error;
  }
}

// Delete availability
async function deleteAvailability(slotId) {
  try {
    const response = await api.delete(`/provider/availability/${slotId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete availability:', error);
    throw error;
  }
}
```

### 12. Admin: Manage Providers

```javascript
// Get all providers (with filters)
async function getAllProviders(filters = {}) {
  try {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 10
    });
    
    if (filters.status) params.append('status', filters.status);
    
    const response = await api.get(`/admin/providers?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    throw error;
  }
}

// Approve provider
async function approveProvider(providerId) {
  try {
    const response = await api.patch(`/admin/provider/${providerId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Approval failed:', error.response?.data?.message);
    throw error;
  }
}

// Reject provider
async function rejectProvider(providerId) {
  try {
    const response = await api.patch(`/admin/provider/${providerId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Rejection failed:', error.response?.data?.message);
    throw error;
  }
}

// Suspend provider
async function suspendProvider(providerId) {
  try {
    const response = await api.patch(`/admin/provider/${providerId}/suspend`);
    return response.data;
  } catch (error) {
    console.error('Suspension failed:', error.response?.data?.message);
    throw error;
  }
}
```

---

## Status Constants

```javascript
// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

// Provider Status
export const PROVIDER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// User Roles
export const USER_ROLES = {
  USER: 'USER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN'
};

// Day of Week
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

// Day names for display
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
```

---

## Helper Functions

### Format Time for Display
```javascript
function formatTime(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Usage: formatTime("14:30") => "2:30 PM"
```

### Format Date for API
```javascript
function formatDateForAPI(date) {
  // date can be Date object or string
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // "2024-01-15"
}
```

### Format Date for Display
```javascript
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Usage: formatDateForDisplay("2024-01-15") => "January 15, 2024"
```

### Get Day Name
```javascript
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}
```

### Validate Time Format
```javascript
function isValidTimeFormat(time) {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}
```

### Calculate Service Duration
```javascript
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes; // Duration in minutes
}

// Usage: calculateDuration("10:00", "12:30") => 150 (minutes)
```

---

## Error Handling

### Centralized Error Handler
```javascript
function handleApiError(error) {
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';
    
    switch (status) {
      case 400:
        // Validation error
        return { error: true, message, type: 'validation' };
      case 401:
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        return { error: true, message: 'Session expired', type: 'auth' };
      case 403:
        // Forbidden - insufficient permissions
        return { error: true, message, type: 'permission' };
      case 404:
        // Not found
        return { error: true, message, type: 'notfound' };
      case 500:
        // Server error
        return { error: true, message: 'Server error. Please try again later.', type: 'server' };
      default:
        return { error: true, message, type: 'unknown' };
    }
  } else if (error.request) {
    // Network error
    return { error: true, message: 'Network error. Please check your connection.', type: 'network' };
  } else {
    // Something else happened
    return { error: true, message: error.message, type: 'unknown' };
  }
}

// Usage
try {
  const data = await someApiCall();
} catch (error) {
  const { message, type } = handleApiError(error);
  // Show error message to user
  showNotification(message, 'error');
}
```

---

## UI State Management Examples

### React Context for User
```javascript
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load user from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);
  
  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };
  
  return (
    <UserContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}
```

### React Hook for Bookings
```javascript
import { useState, useEffect } from 'react';
import { getUserBookings } from './api';

export function useBookings(filters = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const response = await getUserBookings(filters);
        setBookings(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookings();
  }, [JSON.stringify(filters)]);
  
  return { bookings, loading, error, pagination };
}

// Usage in component
function BookingsList() {
  const { bookings, loading, error, pagination } = useBookings({ 
    status: 'APPROVED',
    page: 1 
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {bookings.map(booking => (
        <BookingCard key={booking._id} booking={booking} />
      ))}
    </div>
  );
}
```

---

## Display Components Examples

### Booking Status Badge
```javascript
function BookingStatusBadge({ status }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    COMPLETED: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
}
```

### Rating Stars Display
```javascript
function RatingStars({ rating, size = 'md' }) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };
  
  return (
    <div className={`flex items-center ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
      <span className="ml-2 text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}
```

### Availability Schedule Display
```javascript
function AvailabilitySchedule({ availability }) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Group by day
  const schedule = availability.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});
  
  return (
    <div className="space-y-2">
      {Object.entries(schedule).map(([day, slots]) => (
        <div key={day} className="flex items-start">
          <div className="w-16 font-medium">{dayNames[day]}</div>
          <div className="flex-1">
            {slots.map((slot, idx) => (
              <div key={idx}>
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Form Validation Examples

### Booking Form Validation
```javascript
function validateBookingForm(data) {
  const errors = {};
  
  if (!data.providerId) {
    errors.providerId = 'Provider is required';
  }
  
  if (!data.serviceKey) {
    errors.serviceKey = 'Service is required';
  }
  
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const bookingDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      errors.date = 'Cannot book in the past';
    }
  }
  
  if (!data.startTime) {
    errors.startTime = 'Start time is required';
  } else if (!isValidTimeFormat(data.startTime)) {
    errors.startTime = 'Invalid time format (use HH:MM)';
  }
  
  if (!data.endTime) {
    errors.endTime = 'End time is required';
  } else if (!isValidTimeFormat(data.endTime)) {
    errors.endTime = 'Invalid time format (use HH:MM)';
  }
  
  if (data.startTime && data.endTime) {
    const duration = calculateDuration(data.startTime, data.endTime);
    if (duration <= 0) {
      errors.endTime = 'End time must be after start time';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

### Rating Form Validation
```javascript
function validateRatingForm(data) {
  const errors = {};
  
  if (!data.rating) {
    errors.rating = 'Rating is required';
  } else if (data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }
  
  if (data.review && data.review.length > 500) {
    errors.review = 'Review must be less than 500 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## Testing Examples

### API Call Tests (Jest)
```javascript
import { searchProviders, createBooking } from './api';
import axios from 'axios';

jest.mock('axios');

describe('API Functions', () => {
  test('searchProviders returns providers', async () => {
    const mockProviders = [
      { providerId: '1', name: 'Provider 1' },
      { providerId: '2', name: 'Provider 2' }
    ];
    
    axios.get.mockResolvedValue({ data: mockProviders });
    
    const result = await searchProviders({ city: 'Mumbai' });
    
    expect(result).toEqual(mockProviders);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/providers?city=Mumbai')
    );
  });
  
  test('createBooking sends correct data', async () => {
    const bookingData = {
      providerId: '123',
      serviceKey: 'puja_service',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '12:00'
    };
    
    const mockResponse = { data: { data: { _id: 'booking123', ...bookingData } } };
    axios.post.mockResolvedValue(mockResponse);
    
    const result = await createBooking(bookingData);
    
    expect(result._id).toBe('booking123');
    expect(axios.post).toHaveBeenCalledWith('/bookings', bookingData);
  });
});
```

---

## Performance Tips

1. **Pagination**: Always implement pagination for lists
2. **Debounce Search**: Debounce search inputs to reduce API calls
3. **Cache Provider Details**: Cache provider details for quick access
4. **Lazy Loading**: Load images and heavy components lazily
5. **Optimistic Updates**: Update UI optimistically before API response

---

## Common Pitfalls to Avoid

1. ❌ Don't forget to handle 401 errors (token expiration)
2. ❌ Don't send dates without proper formatting
3. ❌ Don't forget timezone considerations for bookings
4. ❌ Don't allow bookings in the past
5. ❌ Don't forget to validate user permissions before showing actions
6. ❌ Don't expose sensitive data (like geo coordinates) unnecessarily
7. ❌ Don't forget to show loading states
8. ❌ Don't forget pagination when listing data

---

## Useful Packages

- **axios**: HTTP client
- **date-fns** or **dayjs**: Date manipulation
- **react-query**: Data fetching and caching
- **formik** or **react-hook-form**: Form management
- **yup** or **zod**: Schema validation
- **react-toastify**: Toast notifications
- **react-loading-skeleton**: Loading states

---

For detailed API specifications, refer to `API_DOCUMENTATION.md`.
