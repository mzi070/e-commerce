const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authenticate');
const { isAdmin, isCustomer } = require('../middleware/authorize');

// Protected routes - customers can create orders
router.post('/', authenticate, isCustomer, orderController.createOrder);

// Protected routes - only admins can view all orders
router.get('/', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);
router.delete('/:id', authenticate, isAdmin, orderController.deleteOrder);

module.exports = router;
