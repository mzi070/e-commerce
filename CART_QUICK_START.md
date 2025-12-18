# Quick Start Guide - Shopping Cart & Checkout

## 🚀 Getting Started

### 1. Start the Application

```bash
# Terminal 1 - Backend (if not already running)
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 🛒 Using the Shopping Cart

### Adding Items to Cart

1. Navigate to the Products page (`/products`)
2. Click on any product to view details
3. Click the **"Add to Cart"** button
4. See the cart badge in the header update with item count

### Managing Cart Items

1. Click the **Cart** icon in the header
2. You'll see all items with:
   - Product image and details
   - Quantity controls (+/-)
   - Price per item and subtotal
   - Remove button (trash icon)

3. **Update Quantity**: Click + or - buttons
4. **Remove Item**: Click the trash icon
5. **Clear Cart**: Click "Clear Cart" button

### Cart Persists Automatically
- Your cart is saved automatically
- Refresh the page - items remain
- Close browser and reopen - cart is still there
- Works across tabs

---

## 💳 Checkout Process

### Step 1: Navigate to Checkout

From the Cart page, click **"Proceed to Checkout"**

### Step 2: Enter Shipping Information

Fill in all required fields:
- First Name: John
- Last Name: Doe
- Email: john@example.com
- Phone: (555) 123-4567
- Address: 123 Main Street
- City: New York
- State: NY
- ZIP: 10001
- Country: USA (default)

Click **"Continue to Payment"**

### Step 3: Enter Payment Information

**Use Test Card Numbers:**

For Visa:
```
Card Number: 4242 4242 4242 4242
Name: John Doe
Expiry: 12/25
CVV: 123
```

For Mastercard:
```
Card Number: 5555 5555 5555 4444
Name: John Doe
Expiry: 12/25
CVV: 456
```

For American Express:
```
Card Number: 3782 8224 6310 005
Name: John Doe
Expiry: 12/25
CVV: 1234 (4 digits for Amex)
```

Click **"Place Order"**

### Step 4: Payment Processing

- Watch the processing animation (1.5-2.5 seconds)
- See payment success message
- View order confirmation with order ID

### Step 5: Order Confirmation

You'll see:
- ✅ Order Confirmed message
- Order number (e.g., ORD-ABC123)
- Order total
- Estimated delivery (3-5 days)
- Shipping destination

Click **"Continue Shopping"** or **"Back to Home"**

---

## 📦 Viewing Orders

### Access Order History

1. Click **"Orders"** in the navigation menu
2. See all your past orders
3. Each order shows:
   - Order ID and date
   - Items ordered with quantities
   - Total amount
   - Shipping address
   - Payment method (last 4 digits)
   - Transaction ID
   - Status badge

### Order Status Colors
- 🟡 Yellow: Pending
- 🔵 Blue: Processing
- 🟣 Purple: Shipped
- 🟢 Green: Delivered
- 🔴 Red: Cancelled

---

## 🎯 Key Features to Try

### 1. Cart Persistence Test
1. Add 3 different items to cart
2. Close the browser completely
3. Reopen browser and go to the site
4. Check cart - all items still there! ✨

### 2. Quantity Updates
1. Add item to cart with quantity 1
2. Add same item again - quantity becomes 2
3. In cart, use + button to increase
4. Use - button to decrease
5. Set to 0 - item is removed

### 3. Free Shipping
1. Add items totaling less than $50
2. See shipping cost of $10
3. Add more items to exceed $50
4. See "FREE" shipping! 🎉

### 4. Payment Simulation
1. Try different test card numbers
2. Try invalid expiry date (past date) - see error
3. Try invalid CVV (2 digits) - see error
4. Try valid card - see success

### 5. Card Type Detection
1. Start typing card number
2. Watch card type appear (Visa, Mastercard, etc.)
3. Changes in real-time as you type

### 6. Form Validation
1. Try to continue without filling required fields
2. See red error messages
3. Fix errors - messages disappear
4. All fields validate in real-time

---

## 🔥 Pro Tips

### Cart
- **Quick Clear**: Click "Clear Cart" to remove all items at once
- **Direct Edit**: Type quantity directly instead of clicking +/-
- **Link to Product**: Click product image/name to return to product page

### Checkout
- **Edit Address**: From payment step, click "Edit Address" to go back
- **Save Time**: Form remembers your last entries (in development mode)
- **Watch Progress**: Progress bar shows which step you're on

### Payment
- **Auto-Format**: Card numbers automatically format with spaces
- **Smart CVV**: Accepts 3 or 4 digits based on card type
- **Expiry Format**: Auto-formats as MM/YY while typing

### Orders
- **Newest First**: Orders sorted with newest at top
- **Full Details**: All order information preserved
- **Transaction ID**: Use for support inquiries

---

## 📱 Mobile Experience

Everything works great on mobile:
- Responsive cart layout
- Touch-friendly quantity buttons
- Mobile-optimized checkout forms
- Swipeable order cards
- Hamburger menu (if implemented)

---

## 🐛 Troubleshooting

### Cart not saving?
- Check browser localStorage is enabled
- Clear cache if issues persist
- Check browser console for errors

### Payment fails?
- Use only test card numbers provided
- Check expiry date is in the future
- Ensure CVV is 3-4 digits
- Try again (5% random failure rate for testing)

### Orders not showing?
- Complete at least one checkout first
- Check localStorage has data: `localStorage.getItem('ecommerce_orders')`

### Checkout button disabled?
- Cart must have at least one item
- Fill all required fields in shipping form
- Fill all payment fields correctly

---

## 🎨 UI Features

### Visual Feedback
- ✅ Success messages in green
- ❌ Error messages in red
- 🔄 Loading spinners
- 🔢 Real-time counters
- 💳 Card type badges
- 🔒 Security badges

### Animations
- Smooth page transitions
- Button hover effects
- Form focus states
- Loading spinners
- Success checkmarks

### Accessibility
- Keyboard navigation works
- Screen reader friendly
- High contrast colors
- Clear error messages
- Focus indicators

---

## 📊 Test Scenarios

### Scenario 1: First Time User
1. Browse products
2. Add 3 items to cart
3. View cart
4. Complete checkout
5. View order confirmation
6. Check orders page

**Expected**: Smooth flow, clear instructions, successful order

### Scenario 2: Returning User
1. Cart still has items from before
2. Add more items
3. Update quantities
4. Remove one item
5. Complete checkout
6. See new order in orders page

**Expected**: Previous cart persists, new order added

### Scenario 3: Mobile User
1. Access site on mobile device
2. Add items to cart
3. Complete entire checkout on mobile
4. View orders on mobile

**Expected**: Fully functional on mobile, responsive design

---

## 🎉 You're All Set!

The shopping cart and checkout system is fully functional. Enjoy exploring all the features!

**Next Steps:**
- Add more products to test with
- Try different test cards
- Test on mobile devices
- Integrate with real backend when ready
- Add user authentication for personalized experience

**Questions or Issues?**
Check the main implementation docs: `SHOPPING_CART_IMPLEMENTATION.md`
