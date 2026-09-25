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
const { withLock } = require('../utils/mutex');

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered',  'cancelled'],
  delivered:  [],
  cancelled:  [],
};

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
    for (const item of order.items) {
      try {
        const product = await findProductById(item.id);
        await updateProduct(item.id, { stock: product.stock + item.quantity });
      } catch {}
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

// Get all orders (admin) — paginated to prevent OOM on large datasets
exports.getAllOrders = async (req, res) => {
  try {
    const all = await findAllOrders();
    const sorted = all.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const total = sorted.length;
    const data = sorted.slice((page - 1) * limit, page * limit);
    const totalRevenue = all
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    res.json({ data, total, page, totalPages: Math.ceil(total / limit), totalRevenue });
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
    if (!req.user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ message: 'A valid customerEmail is required' });
    }

    // Validate shippingInfo required fields
    if (!shippingInfo || typeof shippingInfo !== 'object') {
      return res.status(400).json({ message: 'shippingInfo is required' });
    }
    const requiredShippingFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredShippingFields.filter(f => !shippingInfo[f]?.toString().trim());
    if (missingFields.length) {
      return res.status(400).json({ message: `shippingInfo missing required fields: ${missingFields.join(', ')}` });
    }

    if (!payment || typeof payment !== 'object' || !payment.transactionId?.toString().trim()) {
      return res.status(400).json({ message: 'payment.transactionId is required' });
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

    // Resolve products from DB, compute subtotal (no stock check yet — done atomically below)
    let subtotal = 0;
    const resolvedItems = [];

    for (const item of dedupedItems) {
      let product;
      try {
        product = await findProductById(item.id);
      } catch {
        return res.status(400).json({ message: `Product "${item.id}" not found` });
      }
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
        if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
          return res.status(400).json({
            message: `Minimum order of $${coupon.minOrder.toFixed(2)} required for this coupon`,
          });
        }
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

    // Atomically check stock and reserve — sorted by ID to prevent deadlocks
    const sortedItems = [...dedupedItems].sort((a, b) => a.id.localeCompare(b.id));
    const reserved = [];
    try {
      for (const item of sortedItems) {
        await withLock(item.id, async () => {
          const current = await findProductById(item.id);
          if (current.stock < item.quantity) {
            throw new Error(`"${current.name}" only has ${current.stock} unit(s) in stock`);
          }
          await updateProduct(item.id, { stock: current.stock - item.quantity });
          reserved.push({ id: item.id, quantity: item.quantity });
        });
      }
    } catch (stockErr) {
      for (const r of reserved) {
        try {
          const p = await findProductById(r.id);
          await updateProduct(r.id, { stock: p.stock + r.quantity });
        } catch {}
      }
      return res.status(400).json({ message: stockErr.message });
    }

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

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status (admin) — state machine prevents invalid transitions
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
    const existing = await findOrderById(req.params.id);
    const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition order from '${existing.status}' to '${status}'`,
      });
    }
    if (status === 'cancelled') {
      for (const item of existing.items) {
        try {
          const product = await findProductById(item.id);
          await updateProduct(item.id, { stock: product.stock + item.quantity });
        } catch {}
      }
    }
    const updated = await updateOrder(req.params.id, { status });
    res.json(updated);
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
    const order = await findOrderById(req.params.id);
    if (order.status !== 'cancelled') {
      for (const item of order.items) {
        try {
          const product = await findProductById(item.id);
          await updateProduct(item.id, { stock: product.stock + item.quantity });
        } catch {}
      }
    }
    await deleteOrder(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
