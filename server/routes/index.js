const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const paymentController = require('../controllers/paymentController');
const orderController = require('../controllers/orderController');

// Middleware
const { protect, authorize } = require('../middleware/auth');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getCurrentUser);

// Product routes
router.get('/products', productController.getAllProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', protect, authorize('admin'), productController.createProduct);
router.put('/products/:id', protect, authorize('admin'), productController.updateProduct);
router.delete('/products/:id', protect, authorize('admin'), productController.deleteProduct);

// Cart routes
router.get('/cart', protect, cartController.getCart);
router.post('/cart', protect, cartController.addToCart);
router.put('/cart', protect, cartController.updateCartItem);
router.delete('/cart/:productId', protect, cartController.removeFromCart);
router.delete('/cart', protect, cartController.clearCart);

// Payment routes
router.post('/payment/create-intent', protect, paymentController.createPaymentIntent);
router.post('/payment/confirm', protect, paymentController.confirmPayment);
router.post('/payment/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// Order routes
router.get('/orders', protect, orderController.getUserOrders);
router.get('/orders/all', protect, authorize('admin'), orderController.getAllOrders);
router.get('/orders/:id', protect, orderController.getOrder);
//router.put('/orders/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);
router.put('/orders/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;