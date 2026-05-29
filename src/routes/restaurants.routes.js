const express = require('express');
const restController = require('../controllers/restaurants.controller');
const prodsRouter = require('./products.routes');

const router = express.Router();

// Collection routes (No specific ID needed).
router.get('/', restController.getRestaurants); // Fetch all.
router.post('/', restController.createRest);    // Create new.

// Item-specific routes (Require a dynamic :id parameter).
router.get('/:id', restController.getRest);         // Fetch one.
router.patch('/:id', restController.updateRest);    // Update one.
router.delete('/:id', restController.deleteRest);   // Delete one.

// Mount the products router nested under a specific restaurant ID
router.use('/:id/products', prodsRouter);

module.exports = router;