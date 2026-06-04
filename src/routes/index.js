const express = require('express');

const router = express.Router();

// Health check route (infrastructure test).
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Import and mount the users router.
const usersRouter = require('./users.routes');
router.use('/users', usersRouter);

// Import and mount the tokens router.
const tokensRouter = require('./tokens.routes');
router.use('/tokens', tokensRouter);

// Import and mount the restaurants router
const restaurantsRouter = require('./restaurants.routes');
router.use('/restaurants', restaurantsRouter);

// Import and mount the products router.
const productsRouter = require('./products.routes');
router.use('/products', productsRouter);

// Import and mount the orders router.
const ordersRouter = require('./orders.routes');
router.use('/orders', ordersRouter);

// Import and mount the search router.
const searchRouter = require('./search.routes');
router.use('/search', searchRouter);

module.exports = router;
