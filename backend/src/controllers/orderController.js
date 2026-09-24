const {
  findAllOrders,
  findOrderById,
  addOrder,
  updateOrder,
  deleteOrder,
} = require('../utils/dbHelpers');

// Cancel order (customer-facing, pending only)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await findOrderById(req.params.id);
    const requesterEmail = req.user?.email || req.body?.email;
    if (!requesterEmail || order.customerEmail?.toLowerCase() !== requesterEmail.toLowerCase()) {
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

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await findAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await findOrderById(req.params.id);
    res.json(order);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerEmail, items, shippingInfo, payment,
      subtotal, shipping, tax, discount, couponCode, total,
    } = req.body;
    if (!customerEmail || !items?.length) {
      return res.status(400).json({ message: 'customerEmail and items are required' });
    }
    const newOrder = await addOrder({
      customerEmail, items, shippingInfo, payment,
      subtotal, shipping, tax, discount, couponCode, total,
      status: 'pending',
    });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrder(req.params.id, { status });
    res.json(order);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get orders by customer email
exports.getMyOrders = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const orders = await findAllOrders();
    const myOrders = orders.filter(
      o => o.customerEmail?.toLowerCase() === email.toLowerCase()
    );
    res.json(myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete order
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
