const restRepo = require('../services/repositories/restaurants.repository');
const productsRepo = require('../services/repositories/products.repository');
const { calcAerialDistance } = require('../services/distance');
const { getRecommendations } = require('../services/tcpClient'); 
const ordersRepo = require('../services/repositories/orders.repository');

// --- Helper Function: Fetch and Filter Restaurants by Radius ---
// Fetches all restaurants, optionally filters them by a 15km radius, and optionally limits the results.
const fetchAndFilterRestaurants = (lat, lng, limit = null, sourceList = null) => {
    let restaurants = sourceList ? sourceList : restRepo.findAll();

    if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const MAX_RADIUS_KM = 15;

        restaurants = restaurants.filter(rest => {
            const dist = calcAerialDistance(userLat, userLng, rest.location.lat, rest.location.lng);
            return dist <= MAX_RADIUS_KM;
        });
    }

    if (limit) {
        return restaurants.slice(0, limit);
    }
    
    return restaurants;
};

// Fetch all restaurants, with optional radius filtering based on user coordinates.
const getRestaurants = (req, res) => {
    // Extract coordinates from the query string.
    const { lat, lng } = req.query;

    // Use the helper function to fetch and filter the restaurants.
    const restaurants = fetchAndFilterRestaurants(lat, lng);

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

// Fetch recommended restaurants using the legacy Ex2 TCP client, filtered by delivery radius.
const getRecomRests = async (req, res) => {
    const userId = req.userId;
    const { lat, lng } = req.query;

    // 1. Find the target restaurant (the last one the user ordered from).
    const allOrders = ordersRepo.findAll();
    const userOrders = allOrders.filter(o => o.userId === userId);
    
    // Fallback if the user has no order history.
    if (userOrders.length === 0) {
        return res.status(200).json(fetchAndFilterRestaurants(lat, lng, 5));
    }

    // Get the ID of the last restaurant the user ordered from.
    const lastOrder = userOrders[userOrders.length - 1];
    const targetRestaurantId = lastOrder.restaurantId;

    try {
        // 2. Fetch recommendations using the TCP client.
        const recommendedIds = await getRecommendations(userId, targetRestaurantId);

        // 3. Fetch the full restaurant objects from the DB using the returned IDs.
        let recomRests = recommendedIds
            .map(id => restRepo.findById(id))
            .filter(rest => rest != null);

        // Using the helper function to filter by distance.
        recomRests = fetchAndFilterRestaurants(lat, lng, 5, recomRests);

        // 4. Fallback if the algorithm returned an empty array.
        if (recomRests.length === 0) {
            // Using the helper for this fallback.
            return res.status(200).json(fetchAndFilterRestaurants(lat, lng, 5));
        }

        // Return the successfully recommended restaurants.
        res.status(200).json(recomRests);
    } catch (error) {
        // Safe fallback in case of unexpected errors.
        console.error('Error fetching recommendations:', error);
        // Using the helper for this fallback.
        res.status(200).json(fetchAndFilterRestaurants(lat, lng, 5));
    }
};

// Export controller functions for the router.
module.exports = {
    getRestaurants,
    createRest,
    getRest,
    updateRest,
    deleteRest,
    getMenu,
    getRecomRests,
};