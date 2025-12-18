const {
  findAllOrders,
  findOrderById,
  addOrder,
  updateOrder,
  deleteOrder,
} = require('../utils/dbHelpers');

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
    const newOrder = await addOrder(req.body);
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
