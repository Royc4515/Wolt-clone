const express = require('express');
const router = express.Router();
const resController = require('../Controllers/restaurants.controller');

router.get('/', resController.getRestaurants);

module.exports = router;