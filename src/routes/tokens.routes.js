const express = require('express');
const router = express.Router();

// Import the users controller containing the business logic.
const usersController = require('../controllers/users.controller');

// Route incoming POST requests (to /api/users/) to the createUser function.
router.post('/', usersController.loginUser);

module.exports = router;