# Backend Database Documentation

## Overview
The backend uses `lowdb` for file-based JSON storage. All data is stored in `backend/db.json` and manipulated through helper functions in `src/utils/dbHelpers.js`.

## Database Structure

```json
{
  "products": [
    {
      "id": "unique-id",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "category": "Category",
      "image": "https://example.com/image.jpg",
      "stock": 50,
      "featured": true,
      "createdAt": "2025-12-18T...",
      "updatedAt": "2025-12-18T..."
    }
  ],
  "users": [],
  "orders": [
    {
      "id": "unique-id",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "items": [
        {
          "productId": "product-id",
          "quantity": 2,
          "price": 29.99
        }
      ],
      "totalAmount": 59.98,
      "status": "pending",
      "shippingAddress": {
        "street": "123 Main St",
        "city": "City",
        "state": "State",
        "zipCode": "12345",
        "country": "Country"
      },
      "createdAt": "2025-12-18T...",
      "updatedAt": "2025-12-18T..."
    }
  ]
}
```

## Database Helper Functions

### Products

#### `findAllProducts()`
Retrieves all products from the database.

**Returns:** Promise<Array> - Array of all products

**Example:**
```javascript
const { findAllProducts } = require('../utils/dbHelpers');

async function getAllProducts() {
  try {
    const products = await findAllProducts();
    console.log(products);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

#### `findProductById(id)`
Finds a single product by ID.

**Parameters:**
- `id` (String): Product ID

**Returns:** Promise<Object> - Product object

**Throws:** Error if product not found

**Example:**
```javascript
const product = await findProductById('product-123');
```

#### `addProduct(productData)`
Creates a new product.

**Parameters:**
- `productData` (Object): Product data (without id, createdAt, updatedAt)

**Returns:** Promise<Object> - Created product with generated ID

**Example:**
```javascript
const newProduct = await addProduct({
  name: 'New Product',
  description: 'Product description',
  price: 39.99,
  category: 'Electronics',
  stock: 100,
  featured: false
});
```

#### `updateProduct(id, updates)`
Updates an existing product.

**Parameters:**
- `id` (String): Product ID
- `updates` (Object): Fields to update

**Returns:** Promise<Object> - Updated product

**Example:**
```javascript
const updated = await updateProduct('product-123', {
  price: 34.99,
  stock: 75
});
```

#### `deleteProduct(id)`
Deletes a product by ID.

**Parameters:**
- `id` (String): Product ID

**Returns:** Promise<Object> - Deleted product

**Example:**
```javascript
await deleteProduct('product-123');
```

### Users

#### `findAllUsers()`
Retrieves all users.

#### `findUserById(id)`
Finds a user by ID.

#### `addUser(userData)`
Creates a new user.

#### `updateUser(id, updates)`
Updates a user.

#### `deleteUser(id)`
Deletes a user.

### Orders

#### `findAllOrders()`
Retrieves all orders.

#### `findOrderById(id)`
Finds an order by ID.

#### `addOrder(orderData)`
Creates a new order.

**Example:**
```javascript
const order = await addOrder({
  customerName: 'Jane Smith',
  customerEmail: 'jane@example.com',
  items: [
    {
      productId: 'product-1',
      quantity: 2,
      price: 29.99
    }
  ],
  totalAmount: 59.98,
  status: 'pending',
  shippingAddress: {
    street: '456 Oak Ave',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    country: 'USA'
  }
});
```

#### `updateOrder(id, updates)`
Updates an order.

#### `deleteOrder(id)`
Deletes an order.

## Using in Controllers

```javascript
const {
  findAllProducts,
  findProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../utils/dbHelpers');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await findAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const newProduct = await addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
```

## Error Handling

All helper functions include try-catch blocks and throw descriptive errors:

```javascript
try {
  const product = await findProductById('invalid-id');
} catch (error) {
  if (error.message === 'Product not found') {
    // Handle not found
  } else {
    // Handle other errors
  }
}
```

## Database Initialization

The database is automatically initialized when the server starts:

```javascript
const { initDB } = require('./config/db');

const startServer = async () => {
  try {
    await initDB(); // Creates db.json if it doesn't exist
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
```

## Sample Data

The database includes sample products by default:
- Sample Product 1 (Electronics) - $29.99
- Sample Product 2 (Clothing) - $49.99

## Testing the API

### Get all products
```bash
curl http://localhost:3000/api/products
```

### Get single product
```bash
curl http://localhost:3000/api/products/1
```

### Create product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Description",
    "price": 49.99,
    "category": "Electronics",
    "stock": 100
  }'
```

### Update product
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 24.99}'
```

### Delete product
```bash
curl -X DELETE http://localhost:3000/api/products/1
```

## Best Practices

1. **Always use async/await** with helper functions
2. **Handle errors** appropriately in controllers
3. **Validate data** before passing to helper functions
4. **Don't modify** the db.json file manually while server is running
5. **Backup** db.json before making significant changes
6. **Use .gitignore** to exclude db.json from version control

## ID Generation

IDs are automatically generated using timestamps and random strings:
```javascript
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
```

This ensures unique IDs across all collections.
