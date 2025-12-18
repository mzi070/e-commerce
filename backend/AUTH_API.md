# Authentication API Documentation

## Overview

This API uses JWT (JSON Web Tokens) for authentication and implements role-based access control (RBAC) with two roles: `customer` and `admin`.

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "customer"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

**Validation:**
- Email: Required, must be valid email format
- Password: Required, minimum 6 characters
- Name: Required
- Role: Optional, defaults to "customer", accepts "customer" or "admin"

---

### Login

**POST** `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

---

### Get Profile

**GET** `/api/auth/profile`

Get the authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "customer",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Change Password

**PUT** `/api/auth/change-password`

Change the authenticated user's password.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

### Logout

**POST** `/api/auth/logout`

Logout the user (client-side token removal).

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

---

## Protected Routes

### Admin-Only Routes

These routes require authentication AND admin role:

- **POST** `/api/products` - Create a new product
- **PUT** `/api/products/:id` - Update a product
- **DELETE** `/api/products/:id` - Delete a product
- **GET** `/api/orders` - Get all orders
- **PATCH** `/api/orders/:id/status` - Update order status
- **DELETE** `/api/orders/:id` - Delete an order

### Customer Routes

These routes require authentication with customer role:

- **POST** `/api/orders` - Create a new order
- **GET** `/api/orders/:id` - Get order by ID (own orders)

### Public Routes

These routes don't require authentication:

- **GET** `/api/products` - Get all products
- **GET** `/api/products/:id` - Get product by ID
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user

---

## Usage Examples

### 1. Register a New Customer

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "name": "Jane Customer"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Create Product (Admin Only)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "name": "New Product",
    "price": 99.99,
    "description": "Product description",
    "category": "Electronics",
    "stock": 50,
    "imageUrl": "https://example.com/image.jpg"
  }'
```

### 5. Create Order (Customer)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98,
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided" 
}
```

or

```json
{
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "message": "User not found"
}
```

### 409 Conflict
```json
{
  "message": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## Security Notes

1. **JWT Tokens**: Tokens expire after 7 days. Store them securely on the client-side (httpOnly cookies or secure storage).
2. **Passwords**: All passwords are hashed using bcrypt with 10 salt rounds before storage.
3. **HTTPS**: Always use HTTPS in production to protect tokens in transit.
4. **Token Storage**: Never store JWT tokens in localStorage in production. Use httpOnly cookies or secure storage.
5. **Environment Variables**: Keep JWT_SECRET secure and never commit it to version control.

---

## Creating an Admin User

To create an admin user, you can use the registration endpoint with `"role": "admin"`:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminPassword123",
    "name": "Admin User",
    "role": "admin"
  }'
```

**Note**: In production, you should restrict admin user creation or implement an invite-only system.
