const restRepo = require('../services/repositories/restaurants.repository');

// Extract all restaurants from the DB.
const getRestaurants = (req, res) => {
    const restaurants = restRepo.findAll();
    res.status(200).json(restaurants);
};

module.exports = {
    getRestaurants
};