# Admin Panel Authentication System

## Overview

This admin panel implements a complete authentication system with secure token management, automatic token refresh, and cookie-based authentication.

## Features

### 🔐 Secure Authentication

- **Cookies + Headers**: Uses both HTTP-only cookies and Authorization headers
- **Automatic Token Refresh**: Automatically refreshes expired tokens
- **Secure Logout**: Clears both cookies and local storage
- **Session Persistence**: Maintains login state across browser refreshes

### Authentication Pages

- **Login** (`/login`) - Admin login with username/email and password
- **Signup** (`/signup`) - Admin account registration
- **Forgot Password** (`/forgot-password`) - Password reset functionality

### Protected Routes

- Dashboard (`/`)
- Products (`/products`)
- Plants (`/plants`)
- Natures (`/natures`)
- Blogs (`/blogs`)
- Inquiries (`/inquiries`)
- Users (`/users`)

## How It Works

### 🔄 Authentication Flow

1. **Login**: User submits credentials → Backend validates → Returns access token + sets cookies
2. **Token Storage**: Access token stored in localStorage for API headers
3. **Cookie Management**: Refresh token stored in HTTP-only cookies (secure)
4. **Auto Refresh**: When API call fails with 401 → Automatically refresh token → Retry request
5. **Logout**: Clear cookies + localStorage + redirect to login

### Before Login

- Users can only access: `/login`, `/signup`, `/forgot-password`
- Any attempt to access protected routes redirects to `/login`
- If already authenticated, auth pages redirect to dashboard

### After Login

- Users can access all admin pages
- Logout functionality available in header dropdown
- User information displayed in header
- Session persists across browser refreshes

## Backend Integration

### API Endpoints Used

- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/refresh-token` - Refresh access token
- `GET /api/v1/users/me` - Get current user

### Token Management

- **Access Token**: Short-lived, stored in localStorage for API headers
- **Refresh Token**: Long-lived, stored in HTTP-only cookies
- **Auto Refresh**: Handled automatically by API interceptor

## Implementation Details

### Components

- `ProtectedRoute` - Wraps admin routes, handles auth verification
- `AuthRedirect` - Wraps auth pages, redirects if already logged in
- `Login`, `Signup`, `ForgotPassword` - Authentication pages

### State Management

- Uses Zustand for authentication state
- `useAuthStore` manages user data and authentication status
- Automatic token refresh and session management

### API Service

- `ApiService` class with automatic token refresh
- Request interceptor for handling 401 errors
- Queue system for concurrent requests during token refresh

## Security Features

### ✅ Implemented

- HTTP-only cookies for refresh tokens
- Automatic token refresh
- Secure logout (clears all tokens)
- Session validation on app start
- Protected route verification

### 🔒 Security Best Practices

- Tokens stored in appropriate locations (cookies vs localStorage)
- Automatic cleanup on authentication failure
- Request queuing during token refresh
- Proper error handling and user feedback

## File Structure

```
src/
├── components/
│   ├── ProtectedRoute.jsx (updated with token verification)
│   ├── AuthRedirect.jsx (updated with token verification)
│   ├── Header.jsx (updated with proper logout)
│   └── ui/
│       └── alert.jsx
├── pages/
│   ├── Login.jsx (updated for backend fields)
│   ├── Signup.jsx (updated for backend fields)
│   ├── ForgotPassword.jsx
│   └── [other admin pages]
├── stores/
│   └── authStore.js (complete rewrite with token management)
├── services/
│   └── api.js (updated with interceptor and token refresh)
└── App.jsx (updated with protected routes)
```

## Testing

### Backend Requirements

- MongoDB database running
- Environment variables configured
- Backend server running on port 3000

### Frontend Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend/admin-panel && npm run dev`
3. Test login/signup flow
4. Test token refresh (wait for token expiry or manually expire)
5. Test logout functionality

## Environment Variables

### Backend (.env)

```
MONGODB_URI=your_mongodb_connection_string
PORT=3000
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
```

### Frontend

- API_BASE_URL in `api.js` should match backend URL
- CORS configured in backend for frontend origin

## Next Steps

1. ✅ Connect to your backend API
2. ✅ Implement proper token management
3. ✅ Add password reset functionality
4. ✅ Add user profile management
5. ✅ Implement role-based access control if needed
