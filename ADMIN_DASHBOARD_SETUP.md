# Admin Dashboard Test Instructions

## Setting up an Admin User for Testing

Since the authentication system uses JWT tokens and stores user data in localStorage, you need to manually set up an admin user for testing purposes.

### Option 1: Using Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run the following commands:

```javascript
// Set admin user
localStorage.setItem('user', JSON.stringify({
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin'
}));

// Set a mock token
localStorage.setItem('token', 'mock-admin-token-12345');

// Refresh the page
location.reload();
```

### Option 2: Using Application/Storage Tab

1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Under Storage → Local Storage, select your domain
4. Add these key-value pairs:
   - Key: `user`
   - Value: `{"id":"admin-1","email":"admin@example.com","name":"Admin User","role":"admin"}`
   
   - Key: `token`
   - Value: `mock-admin-token-12345`

5. Refresh the page

### Accessing the Admin Dashboard

Once you've set up the admin user:

1. You should see an "Admin" link in the header navigation (purple colored with a gear icon)
2. Click on it or navigate to: `http://localhost:5173/admin`
3. You should now have full access to the admin dashboard

## Admin Dashboard Features

### 1. **Overview Tab**
   - Dashboard statistics (total products, orders, users, revenue)
   - Recent orders summary
   - Low stock alerts

### 2. **Products Tab**
   - View all products in a table format
   - **Create**: Click "Add Product" button to create new products
   - **Read**: See product details (name, category, price, stock)
   - **Update**: Click "Edit" button on any product row
   - **Delete**: Click "Delete" button to remove products
   - Low stock indicators (red for <10, yellow for <30)

### 3. **Orders Tab**
   - View all customer orders
   - Update order status (pending, processing, shipped, delivered, cancelled)
   - Expand order details to see items and shipping information
   - Orders from the checkout process will appear here automatically

### 4. **Users Tab**
   - View all registered users
   - See user statistics (total orders, total spent)
   - View user roles and status

## Testing Regular User Access

To test that non-admin users cannot access the dashboard:

```javascript
// Set regular user
localStorage.setItem('user', JSON.stringify({
  id: 'user-1',
  email: 'user@example.com',
  name: 'Regular User',
  role: 'customer'
}));

localStorage.setItem('token', 'mock-user-token-12345');

location.reload();
```

Then try to navigate to `/admin` - you should see an "Access Denied" page.

## Mock Data

The admin dashboard comes pre-loaded with:
- 5 sample products (can be edited/deleted)
- 4 sample orders with various statuses
- 6 sample users (including an admin)

All data is stored in localStorage, so your changes will persist across page refreshes.

### LocalStorage Keys Used:
- `admin_products` - Stores product data
- `ecommerce_orders` - Stores order data (shared with customer Orders page)
- `user` - Current logged-in user data
- `token` - Authentication token

## Creating New Products

When adding a new product, fill in:
- **Name**: Product name
- **Category**: Select from Electronics, Accessories, Clothing, Home, Sports
- **Price**: Product price (numeric)
- **Stock**: Available quantity (numeric)
- **Description**: Product description
- **Image URL**: External image URL (use Unsplash or similar)

Example image URLs from Unsplash:
- `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500`
- `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500`

## Order Status Management

You can update order statuses through the dropdown in the Orders tab:
- **Pending**: Order placed, awaiting processing
- **Processing**: Order being prepared
- **Shipped**: Order dispatched to customer
- **Delivered**: Order received by customer
- **Cancelled**: Order cancelled

Status changes are reflected in the customer's Orders page immediately.

## Resetting Data

To reset all data to the initial state:

```javascript
localStorage.removeItem('admin_products');
localStorage.removeItem('ecommerce_orders');
location.reload();
```

The dashboard will regenerate the mock data on next load.
