const restRepo = require('../services/repositories/restaurants.repository');

// Extract all restaurants from the DB.
const getRestaurants = (req, res) => {
    const restaurants = restRepo.findAll();
    res.status(200).json(restaurants);
};

// Create a new restaurant.
const createRest = (req, res) => {
    const { name } = req.body;

    // Basic validation, ensuring name is provided.
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    // Pass the entire request body to allow optional fields (e.g., address).
    const newRest = restRepo.create(req.body);
    res.status(201).json({ id: newRest.id });
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

    // The update function returns the updated object or null if not found.
    const updatedRest = restRepo.update(id, req.body);

    if (!updatedRest) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    // Respond with "204 No Content" on successful update.
    res.status(204).send();
};

// Delete a restaurant by its ID.
const deleteRest = (req, res) => {
    const { id } = req.params;

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