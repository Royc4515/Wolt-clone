const express = require('express');
const restController = require('../controllers/restaurants.controller');
const prodsRouter = require('./products.routes');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Collection routes (No specific ID needed).
router.get('/', restController.getRestaurants); // Fetch all.
router.post('/', requireAuth, requireAdmin, restController.createRest);    // Create new (protected).

// Item-specific routes (Require a dynamic :id parameter).
router.get('/:id', restController.getRest);                      // Fetch one.
router.get('/:id/menu', restController.getMenu);                 // Fetch menu sections.
router.patch('/:id', requireAuth, requireAdmin, restController.updateRest);    // Update one (protected).
router.delete('/:id', requireAuth, requireAdmin, restController.deleteRest);   // Delete one (protected).

// Mount the products router nested under a specific restaurant ID
router.use('/:id/products', prodsRouter);

module.exports = router;