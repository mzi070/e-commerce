# Authentication Flow Diagram

## User Registration Flow

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ POST /api/auth/register
       │ { email, password, name, role? }
       │
       ▼
┌─────────────────────────────────┐
│  AuthController.register()       │
├─────────────────────────────────┤
│ 1. Validate input               │
│ 2. Check if email exists        │
│ 3. Hash password (bcrypt)       │
│ 4. Create user in database      │
│ 5. Generate JWT token           │
│ 6. Return token + user data     │
└──────────────┬──────────────────┘
               │
               │ 201 Created
               │ { token, user, message }
               │
               ▼
        ┌─────────────┐
        │   Client    │
        │ Store token │
        └─────────────┘
```

---

## User Login Flow

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { email, password }
       │
       ▼
┌─────────────────────────────────┐
│  AuthController.login()          │
├─────────────────────────────────┤
│ 1. Find user by email           │
│ 2. Compare passwords (bcrypt)   │
│ 3. Generate JWT token           │
│ 4. Return token + user data     │
└──────────────┬──────────────────┘
               │
               │ 200 OK
               │ { token, user, message }
               │
               ▼
        ┌─────────────┐
        │   Client    │
        │ Store token │
        └─────────────┘
```

---

## Protected Route Access Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ GET /api/auth/profile
       │ Authorization: Bearer <token>
       │
       ▼
┌─────────────────────────────────┐
│  authenticate middleware         │
├─────────────────────────────────┤
│ 1. Extract token from header    │
│ 2. Verify JWT signature         │
│ 3. Decode payload (user ID)     │
│ 4. Find user in database        │
│ 5. Attach user to req.user      │
└──────────────┬──────────────────┘
               │
               │ User authenticated
               │
               ▼
┌─────────────────────────────────┐
│  AuthController.getProfile()     │
├─────────────────────────────────┤
│ 1. Get user from req.user       │
│ 2. Return user data             │
└──────────────┬──────────────────┘
               │
               │ 200 OK
               │ { id, email, name, role }
               │
               ▼
        ┌─────────────┐
        │   Client    │
        └─────────────┘
```

---

## Admin-Only Route Access Flow

```
┌─────────────┐
│   Client    │
│  (Admin)    │
└──────┬──────┘
       │
       │ POST /api/products
       │ Authorization: Bearer <admin-token>
       │ { product data }
       │
       ▼
┌─────────────────────────────────┐
│  authenticate middleware         │
├─────────────────────────────────┤
│ 1. Extract & verify token       │
│ 2. Find user in database        │
│ 3. Attach user to req.user      │
└──────────────┬──────────────────┘
               │
               │ User authenticated
               │
               ▼
┌─────────────────────────────────┐
│  isAdmin middleware              │
├─────────────────────────────────┤
│ 1. Check req.user.role          │
│ 2. If role !== 'admin'          │
│    → Return 403 Forbidden       │
│ 3. If role === 'admin'          │
│    → Continue to controller     │
└──────────────┬──────────────────┘
               │
               │ Admin authorized
               │
               ▼
┌─────────────────────────────────┐
│  ProductController.create()      │
├─────────────────────────────────┤
│ 1. Validate product data        │
│ 2. Create product in database   │
│ 3. Return created product       │
└──────────────┬──────────────────┘
               │
               │ 201 Created
               │ { product }
               │
               ▼
        ┌─────────────┐
        │   Client    │
        └─────────────┘
```

---

## Unauthorized Access Flow

```
┌─────────────┐
│   Client    │
│ (No Token)  │
└──────┬──────┘
       │
       │ GET /api/auth/profile
       │ (No Authorization header)
       │
       ▼
┌─────────────────────────────────┐
│  authenticate middleware         │
├─────────────────────────────────┤
│ 1. Extract token from header    │
│ 2. No token found               │
│ 3. Return 401 Unauthorized      │
└──────────────┬──────────────────┘
               │
               │ 401 Unauthorized
               │ { message: "No token provided" }
               │
               ▼
        ┌─────────────┐
        │   Client    │
        │ Redirect to │
        │    Login    │
        └─────────────┘
```

---

## Customer Accessing Admin Route Flow

```
┌─────────────┐
│   Client    │
│ (Customer)  │
└──────┬──────┘
       │
       │ DELETE /api/products/123
       │ Authorization: Bearer <customer-token>
       │
       ▼
┌─────────────────────────────────┐
│  authenticate middleware         │
├─────────────────────────────────┤
│ 1. Token valid ✓                │
│ 2. User found ✓                 │
│ 3. req.user = customer          │
└──────────────┬──────────────────┘
               │
               │ User authenticated
               │
               ▼
┌─────────────────────────────────┐
│  isAdmin middleware              │
├─────────────────────────────────┤
│ 1. Check req.user.role          │
│ 2. role = 'customer' ✗          │
│ 3. Return 403 Forbidden         │
└──────────────┬──────────────────┘
               │
               │ 403 Forbidden
               │ { message: "Access denied" }
               │
               ▼
        ┌─────────────┐
        │   Client    │
        │ Show error  │
        └─────────────┘
```

---

## Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": "user-uuid-here",
  "iat": 1234567890,      // Issued at
  "exp": 1234567890       // Expires in 7 days
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)

Full Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXV1aWQifQ.signature
```

---

## Middleware Chain Examples

### Public Route (No Auth Required)
```
Request → GET /api/products
       → ProductController.getAll()
       → Response
```

### Protected Route (Auth Required)
```
Request → GET /api/auth/profile
       → authenticate middleware
       → AuthController.getProfile()
       → Response
```

### Admin Route (Auth + Role Required)
```
Request → POST /api/products
       → authenticate middleware
       → isAdmin middleware
       → ProductController.create()
       → Response
```

### Customer Route (Auth + Role Required)
```
Request → POST /api/orders
       → authenticate middleware
       → isCustomer middleware
       → OrderController.create()
       → Response
```

---

## Database Interaction Flow

```
┌────────────────────────────────────────────┐
│           Database (db.json)               │
├────────────────────────────────────────────┤
│                                            │
│  {                                         │
│    "users": [                              │
│      {                                     │
│        "id": "uuid",                       │
│        "email": "user@example.com",        │
│        "password": "$2a$10$hashed...",     │
│        "name": "John Doe",                 │
│        "role": "customer",                 │
│        "createdAt": "2024-01-15..."        │
│      }                                     │
│    ],                                      │
│    "products": [...],                      │
│    "orders": [...]                         │
│  }                                         │
│                                            │
└────────────────┬───────────────────────────┘
                 │
                 │ CRUD Operations
                 │
┌────────────────▼───────────────────────────┐
│         Database Helpers                   │
│        (src/utils/dbHelpers.js)            │
├────────────────────────────────────────────┤
│                                            │
│  • findUserById(id)                        │
│  • findUserByEmail(email)                  │
│  • createUser(userData)                    │
│  • updateUser(id, updates)                 │
│  • deleteUser(id)                          │
│                                            │
│  • getAllProducts()                        │
│  • findProductById(id)                     │
│  • createProduct(productData)              │
│  • updateProduct(id, updates)              │
│  • deleteProduct(id)                       │
│                                            │
│  • getAllOrders()                          │
│  • findOrderById(id)                       │
│  • createOrder(orderData)                  │
│  • updateOrder(id, updates)                │
│  • deleteOrder(id)                         │
│                                            │
└────────────────────────────────────────────┘
```

---

## Error Response Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Middleware / Controller         │
└──────────────┬──────────────────┘
               │
               │ Error occurs
               │
               ▼
┌─────────────────────────────────┐
│  Error Handling                  │
├─────────────────────────────────┤
│ Status Code Decision:           │
│  • 400 - Bad Request            │
│  • 401 - Unauthorized           │
│  • 403 - Forbidden              │
│  • 404 - Not Found              │
│  • 409 - Conflict (duplicate)   │
│  • 500 - Server Error           │
└──────────────┬──────────────────┘
               │
               │ Error Response
               │
               ▼
        ┌─────────────┐
        │   Client    │
        │ { message } │
        └─────────────┘
```

---

## Complete Request-Response Lifecycle

```
1. CLIENT SENDS REQUEST
   ↓
2. EXPRESS RECEIVES REQUEST
   ↓
3. MIDDLEWARE PIPELINE
   ├─ CORS
   ├─ JSON Parser
   ├─ authenticate (if protected)
   └─ authorize (if role required)
   ↓
4. ROUTE HANDLER
   ↓
5. CONTROLLER
   ├─ Validate input
   ├─ Process business logic
   └─ Database operations
   ↓
6. SEND RESPONSE
   ↓
7. CLIENT RECEIVES RESPONSE
```

---

This diagram shows the complete authentication flow from client request to server response!
