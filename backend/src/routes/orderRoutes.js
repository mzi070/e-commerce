const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { isAdmin } = require('../middleware/authorize');

// Guest-friendly: anyone can place an order
router.post('/', optionalAuth, orderController.createOrder);

// Requires authentication — email is derived from the verified JWT, not a query param
router.get('/mine', authenticate, orderController.getMyOrders);

// Cancel requires authentication so ownership is verified via JWT
router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

// Admin routes
router.get('/', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);
router.delete('/:id', authenticate, isAdmin, orderController.deleteOrder);

module.exports = router;
