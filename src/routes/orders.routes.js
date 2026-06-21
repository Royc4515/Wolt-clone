'use strict';

const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Collection routes (No specific ID needed). All endpoints protected.
router.post('/', requireAuth, ordersController.createOrder);
router.get('/', requireAuth, ordersController.getAllOrders);

// Item-specific routes (Require a dynamic :id parameter).
router.get('/:id', requireAuth, ordersController.getOrder);
router.patch('/:id', requireAuth, ordersController.updateOrder);
router.delete('/:id', requireAuth, ordersController.deleteOrder);

// Endpoint to update order status (protected by authentication AND admin role).
router.patch('/:id/status', requireAuth, requireAdmin, ordersController.updateOrderStatus);
// Endpoint to get all orders for a specific restaurant (protected by auth AND admin role)
router.get('/restaurant/:restaurantId', requireAuth, requireAdmin, ordersController.getRestaurantOrders);

module.exports = router;