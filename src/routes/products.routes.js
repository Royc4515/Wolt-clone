'use strict';

const express = require('express');
const prodsController = require('../controllers/products.controller');

// mergeParams: true allows this router to access the :id parameter from the parent restaurants router.
const router = express.Router({ mergeParams: true });

// Collection routes (Menu level - requires restaurant :id from parent).
router.get('/', prodsController.getAllProducts);        // Fetch all products for the restaurant.
router.post('/', prodsController.createProduct);        // Add a new product to the restaurant.

// Item-specific routes (Product level - requires specific product :pid).
router.get('/:pid', prodsController.getProduct);        // Fetch a specific product.
router.patch('/:pid', prodsController.updateProduct);   // Update a specific product.
router.delete('/:pid', prodsController.deleteProduct);  // Delete a specific product.

module.exports = router;
