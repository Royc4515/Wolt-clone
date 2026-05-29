const express = require('express');
const router = express.Router();
const restController = require('../controllers/restaurants.controller');

// Collection routes (No specific ID needed).
router.get('/', restController.getRestaurants); // Fetch all.
router.post('/', restController.createRest);    // Create new.

// Item-specific routes (Require a dynamic :id parameter).
router.get('/:id', restController.getRest);         // Fetch one.
router.patch('/:id', restController.updateRest);    // Update one.
router.delete('/:id', restController.deleteRest);   // Delete one.

module.exports = router;