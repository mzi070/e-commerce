const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { isAdmin } = require('../middleware/authorize');

// Guest-friendly: anyone can place an order
router.post('/', optionalAuth, orderController.createOrder);

// Fetch orders by email (used by Orders page)
router.get('/mine', optionalAuth, orderController.getMyOrders);

// Customer cancel (pending orders only)
router.patch('/:id/cancel', optionalAuth, orderController.cancelOrder);

// Admin routes
router.get('/', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);
router.delete('/:id', authenticate, isAdmin, orderController.deleteOrder);

module.exports = router;
