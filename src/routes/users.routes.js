const express = require('express');
const router = express.Router();

// Import the users controller containing the business logic.
const usersController = require('../controllers/users.controller');

// Route incoming POST requests (to /api/users/) to the createUser function.
router.post('/', usersController.createUser);

// Route incoming GET requests with an ID parameter.
router.get('/:id', usersController.getUser);

module.exports = router;