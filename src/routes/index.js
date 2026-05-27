const express = require('express');

const router = express.Router();

// Health check route (infrastructure test).
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Import the users router.
const usersRouter = require('./users.routes');

// Mount the users router under the '/users' path.
router.use('/users', usersRouter);

module.exports = router;
