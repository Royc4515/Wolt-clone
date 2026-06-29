const express = require('express');
const router = express.Router();

// Import the users controller containing the business logic, and the middleware.
const usersController = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth')

// Route incoming POST requests (to /api/users/) to the createUser function.
router.post('/', usersController.createUser);

// Route incoming GET requests with an ID parameter.
router.get('/:id', usersController.getUser);

// Route incoming PATCH requests with an ID and authentication.
router.patch('/:id', requireAuth, usersController.updateUser);

// Route incoming DELETE requests with an ID and authentication.
router.delete('/:id', requireAuth, usersController.deleteUser);

module.exports = router;