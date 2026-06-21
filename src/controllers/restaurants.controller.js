const restRepo = require('../services/repositories/restaurants.repository');
const productsRepo = require('../services/repositories/products.repository');
const { calcAerialDistance } = require('../services/distance');

// Fetch all restaurants, with optional radius filtering based on user coordinates.
const getRestaurants = (req, res) => {
    // Fetch all restaurants from the database initially.
    let restaurants = restRepo.findAll();

    // Extract coordinates from the query string.
    const { lat, lng } = req.query;

    // If both latitude and longitude are provided in the request, filter the results.
    if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const MAX_RADIUS_KM = 15; // Ensure this matches the order radius logic.

        // Filter out restaurants that are beyond the maximum delivery radius.
        restaurants = restaurants.filter(rest => {
            const dist = calcAerialDistance(userLat, userLng, rest.location.lat, rest.location.lng);
            return dist <= MAX_RADIUS_KM;
        });
    }

    // Return the filtered (or unfiltered) list of restaurants.
    res.status(200).json(restaurants);
};

// Create a new restaurant.
const createRest = (req, res) => {
    const { 
        name, description, location, category, phone, openHours, 
        isPromoted, rating, image, deliveryFee, deliveryTime
    } = req.body;

    // Validation for mandatory data.
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!location || !location.lat || !location.lng) missingFields.push("Location (lat & lng)");
    if (!category) missingFields.push("Category");

    if (missingFields.length > 0) {
        return res.status(400).json({ error: `${missingFields.join(', ')} is required` });
    }

    // Building the new object's data.
    const newRestData = {
        name,
        description: description || "",
        location,
        category,
        phone: phone || "",
        openHours: openHours || "",
        isPromoted: isPromoted || false,
        rating: rating || 0,
        image: image || "",
        // Store the base delivery fee (Default: 0).
        deliveryFee: deliveryFee || 0,       
        // Store the average delivery time for feed display (Default: 30 mins).
        deliveryTime: deliveryTime || 30,
        ownerId: req.userId
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

    // Ensure that the user trying to update is the owner.
    if (restaurant.ownerId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the owner can update this restaurant" });
    }

    // Update the restaurant with only the permitted fields.
    const { ownerId, id: bodyId, ...allowedUpdates } = req.body;
    restRepo.update(id, allowedUpdates);
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

    // Ensure that the user trying to delete is the owner.
    if (restaurant.ownerId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the owner can delete this restaurant" });
    }

    // Delete the restaurant.
    restRepo.remove(id);
    res.status(204).send();
}

// Return all products for a restaurant grouped into menu sections.
const getMenu = (req, res) => {
    const { id } = req.params;
    const restaurant = restRepo.findById(id);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    const products = productsRepo.findBy(p => p.restId === id);

    const sectionsMap = new Map();
    products.forEach(p => {
        const title = p.section || 'Menu';
        if (!sectionsMap.has(title)) {
            sectionsMap.set(title, {
                id: title.toLowerCase().replace(/\s+/g, '-'),
                title,
                _order: p.sectionOrder ?? 0,
                items: [],
            });
        }
        sectionsMap.get(title).items.push(p);
    });

    const sections = [...sectionsMap.values()]
        .sort((a, b) => a._order - b._order)
        .map(({ _order, ...section }) => section);

    res.status(200).json(sections);
};

// Export controller functions for the router.
module.exports = {
    getRestaurants,
    createRest,
    getRest,
    updateRest,
    deleteRest,
    getMenu,
};