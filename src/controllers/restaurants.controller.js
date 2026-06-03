const restRepo = require('../services/repositories/restaurants.repository');

// Extract all restaurants from the DB.
const getRestaurants = (req, res) => {
    const restaurants = restRepo.findAll();
    res.status(200).json(restaurants);
};

// Create a new restaurant.
const createRest = (req, res) => {
    const { name, description, address, phone, openHours, tags, rating } = req.body;

    // Validation for mandatory data.
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!address) missingFields.push("Address");
    if (!phone) missingFields.push("Phone number");

    if (missingFields.length > 0) {
        return res.status(400).json({ error: `${missingFields.join(', ')} is required` });
    }

    // Building the new object's data.
    const newRestData = {
        name,
        description: description || "",
        address,
        phone,
        openHours: openHours || "",
        tags: tags || [],
        rating: rating || 0,
        creatorId: req.userId
    };

    // Pass the data to create a new object.
    const newRest = restRepo.create(newRestData);
    res.setHeader('Location', `/api/restaurants/${newRest.id}`);
    res.status(201).send();
};

// Retrieve a specific restaurant by its ID.
const getRest = (req,res) => {
    const { id } = req.params;
    const restaurant = restRepo.findById(id);

    // Handle case where the ID is not in DB.
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json(restaurant);
};

// Update an existing restaurant's details.
const updateRest = (req, res) => {
    const { id } = req.params;

    // Check that the restaurant exists in DB.
    const restaurant = restRepo.findById(id);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    // Ensure that the user trying to update is the creator.
    if (restaurant.creatorId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the creator can update this restaurant" });
    }

    // Update the restaurant.
    restRepo.update(id, req.body);
    res.status(204).send();
};

// Delete a restaurant by its ID.
const deleteRest = (req, res) => {
    const { id } = req.params;

    // Check that the restaurant exists in DB.
    const restaurant = restRepo.findById(id);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    // Ensure that the user trying to delete is the creator.
    if (restaurant.creatorId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the creator can update this restaurant" });
    }

    // Delete the restaurant.
    restRepo.remove(id);
    res.status(204).send();
}

// Export controller functions for the router.
module.exports = {
    getRestaurants,
    createRest,
    getRest,
    updateRest,
    deleteRest
};