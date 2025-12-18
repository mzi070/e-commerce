# Shopping Cart Hook Documentation

## Overview
The shopping cart is managed through a React Context and custom hook that provides cart functionality with localStorage persistence.

## Usage

### Import the hook
```javascript
import { useCart } from '../hooks/useCart';
```

### Use in components
```javascript
function ProductCard({ product }) {
  const { addToCart, cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  
  // Add item to cart
  const handleAddToCart = () => {
    addToCart(product);
  };
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

## Available Functions

### `addToCart(item)`
Adds a product to the cart. If the product already exists, increments the quantity.

**Parameters:**
- `item` (Object): Product object with at least `id`, `name`, and `price`

**Example:**
```javascript
const product = {
  id: '1',
  name: 'Sample Product',
  price: 29.99,
  image: 'https://example.com/image.jpg'
};
addToCart(product);
```

### `removeFromCart(itemId)`
Removes a product from the cart completely.

**Parameters:**
- `itemId` (String): The product ID to remove

**Example:**
```javascript
removeFromCart('1');
```

### `updateQuantity(itemId, quantity)`
Updates the quantity of a specific product in the cart.

**Parameters:**
- `itemId` (String): The product ID
- `quantity` (Number): New quantity (if 0 or less, item is removed)

**Example:**
```javascript
updateQuantity('1', 5); // Set quantity to 5
updateQuantity('1', 0); // Removes the item
```

### `clearCart()`
Removes all items from the cart.

**Example:**
```javascript
clearCart();
```

### `getCartTotal()`
Calculates the total price of all items in the cart.

**Returns:** Number - Total cart value

**Example:**
```javascript
const total = getCartTotal();
console.log(`Total: $${total.toFixed(2)}`);
```

### `cart`
Access the current cart state directly.

**Returns:** Array of cart items with structure:
```javascript
[
  {
    id: '1',
    name: 'Product Name',
    price: 29.99,
    quantity: 2,
    ...otherProductProps
  }
]
```

## localStorage Persistence

The cart automatically persists to localStorage:
- **Key:** `ecommerce_cart`
- **Format:** JSON string
- **Auto-save:** Cart is saved on every change
- **Auto-load:** Cart is loaded on app initialization

### Error Handling
If localStorage is unavailable (e.g., in private browsing mode), the cart will:
- Still function normally in memory
- Log errors to console
- Gracefully degrade without crashing

## Example: Complete Cart Component

```javascript
import React from 'react';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/helpers';

function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  
  if (cart.length === 0) {
    return <div>Your cart is empty</div>;
  }
  
  return (
    <div className="cart">
      <h1>Shopping Cart</h1>
      
      {cart.map(item => (
        <div key={item.id} className="cart-item">
          <h3>{item.name}</h3>
          <p>{formatPrice(item.price)}</p>
          
          <div>
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          </div>
          
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      
      <div className="cart-total">
        <h2>Total: {formatPrice(getCartTotal())}</h2>
        <button onClick={clearCart}>Clear Cart</button>
        <button>Checkout</button>
      </div>
    </div>
  );
}

export default CartPage;
```

## Best Practices

1. **Always wrap your app with CartProvider:**
   ```javascript
   import CartProvider from './contexts/CartContext';
   
   function App() {
     return (
       <CartProvider>
         {/* Your app components */}
       </CartProvider>
     );
   }
   ```

2. **Use the hook only inside CartProvider:**
   The `useCart` hook will throw an error if used outside the provider.

3. **Handle edge cases:**
   - Check if cart is empty before rendering items
   - Validate product data before adding to cart
   - Handle localStorage errors gracefully

4. **Performance:**
   - The cart state updates trigger re-renders only in components using the hook
   - localStorage operations are wrapped in try-catch for safety
