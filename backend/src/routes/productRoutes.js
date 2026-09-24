const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authenticate');
const { isAdmin } = require('../middleware/authorize');

// Public routes - anyone can view products
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes - only admins can create, update, delete products
router.post('/', authenticate, isAdmin, productController.createProduct);
router.put('/:id', authenticate, isAdmin, productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

// Review routes (nested under product)
router.get('/:productId/reviews', reviewController.getProductReviews);
router.post('/:productId/reviews', authenticate, reviewController.createReview);
router.delete('/:productId/reviews/:reviewId', authenticate, reviewController.deleteReview);

module.exports = router;
