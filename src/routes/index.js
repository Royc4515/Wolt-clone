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

module.exports = router;
