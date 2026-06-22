'use strict';

const express = require('express');
const prodsController = require('../controllers/products.controller');
const { requireAuth } = require('../middleware/auth');

// mergeParams: true allows this router to access the :id parameter from the parent restaurants router.
const router = express.Router({ mergeParams: true });

// Collection routes (Menu level - requires restaurant :id from parent).
router.get('/', prodsController.getAllProducts);        // Fetch all products for the restaurant.
router.post('/', requireAuth, prodsController.createProduct);        // Add a new product to the restaurant (protected).

// Get recommended products for the specific restaurant.
router.get('/recommended', requireAuth, prodsController.getRecomProds);

// Item-specific routes (Product level - requires specific product :pid).
router.get('/:pid', prodsController.getProduct);        // Fetch a specific product.
router.patch('/:pid', requireAuth, prodsController.updateProduct);   // Update a specific product (protected).
router.delete('/:pid', requireAuth, prodsController.deleteProduct);  // Delete a specific product (protected).

module.exports = router;
