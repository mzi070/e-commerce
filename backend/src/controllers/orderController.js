const {
  findAllOrders,
  findOrderById,
  addOrder,
  updateOrder,
  deleteOrder,
  findProductById,
  findCouponByCode,
  updateProduct,
} = require('../utils/dbHelpers');

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Cancel order — authenticated customers only; ownership verified via JWT
exports.cancelOrder = async (req, res) => {
  try {
    const order = await findOrderById(req.params.id);
    if (order.customerEmail?.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }
    const updated = await updateOrder(req.params.id, { status: 'cancelled' });
    res.json(updated);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await findAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single order by ID — non-admins may only access their own orders
exports.getOrderById = async (req, res) => {
  try {
    const order = await findOrderById(req.params.id);
    if (
      req.user.role !== 'admin' &&
      order.customerEmail?.toLowerCase() !== req.user.email.toLowerCase()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Create order — recalculates all totals server-side; ignores client-supplied prices
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingInfo, payment, couponCode } = req.body;
    // Authenticated users: email comes from JWT; guests supply it in the body
    const customerEmail = req.user ? req.user.email : req.body.customerEmail;
    if (!customerEmail || !items?.length) {
      return res.status(400).json({ message: 'customerEmail and items are required' });
    }

    // Dedup items by product ID, summing quantities for duplicates
    const itemMap = new Map();
    for (const item of items) {
      if (!item.id || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: 'Each item needs an id and a positive integer quantity' });
      }
      itemMap.set(item.id, (itemMap.get(item.id) || 0) + item.quantity);
    }
    const dedupedItems = Array.from(itemMap.entries()).map(([id, quantity]) => ({ id, quantity }));

    // Resolve products from DB, check stock, compute subtotal
    let subtotal = 0;
    const resolvedItems = [];
    const productMap = new Map();

    for (const item of dedupedItems) {
      let product;
      try {
        product = await findProductById(item.id);
      } catch {
        return res.status(400).json({ message: `Product "${item.id}" not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `"${product.name}" only has ${product.stock} unit(s) in stock`,
        });
      }
      productMap.set(product.id, product);
      subtotal += product.price * item.quantity;
      resolvedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
      });
    }

    // Validate and apply coupon server-side
    let discount = 0;
    let freeShippingCoupon = false;
    let appliedCouponCode = undefined;

    if (couponCode) {
      const coupon = await findCouponByCode(couponCode);
      if (coupon && coupon.active !== false) {
        if (coupon.type === 'percent') {
          discount = subtotal * (coupon.value / 100);
        } else if (coupon.type === 'fixed') {
          discount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === 'shipping') {
          freeShippingCoupon = true;
        }
        appliedCouponCode = couponCode.toUpperCase();
      }
    }

    const shipping = (subtotal >= 50 || freeShippingCoupon) ? 0 : 10;
    const tax = subtotal * 0.1;
    const total = Math.max(0, subtotal + shipping + tax - discount);

    const newOrder = await addOrder({
      customerEmail,
      items: resolvedItems,
      shippingInfo,
      payment,
      subtotal,
      shipping,
      tax,
      discount,
      couponCode: appliedCouponCode,
      total,
      status: 'pending',
    });

    // Decrement stock after successful order creation (Phase 3 adds mutex for atomicity)
    for (const [id, product] of productMap) {
      const qty = resolvedItems.find(i => i.id === id).quantity;
      await updateProduct(id, { stock: Math.max(0, product.stock - qty) });
    }

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status (admin) — allowlist prevents arbitrary status strings
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
    const order = await updateOrder(req.params.id, { status });
    res.json(order);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get orders for the authenticated user — email comes from JWT, not query params
exports.getMyOrders = async (req, res) => {
  try {
    const email = req.user.email;
    const orders = await findAllOrders();
    const myOrders = orders
      .filter(o => o.customerEmail?.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(myOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    await deleteOrder(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
