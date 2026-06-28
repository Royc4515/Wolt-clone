const Restaurant = require('../models/Restaurant');
const productsRepo = require('../services/repositories/products.repository');
const { calcAerialDistance } = require('../services/distance');
const { getRecommendations } = require('../services/tcpClient');
const ordersRepo = require('../services/repositories/orders.repository');
const restaurantsService = require('../services/restaurants.service');

const MAX_RADIUS_KM = 15;

const filterByRadius = (restaurants, lat, lng) => {
    if (!lat || !lng) return restaurants;
    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);
    return restaurants.filter(r =>
        calcAerialDistance(uLat, uLng, r.location.lat, r.location.lng) <= MAX_RADIUS_KM
    );
};

// Fetch all restaurants, with optional 15 km radius filtering.
const getRestaurants = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const restaurants = await Restaurant.find();
        res.status(200).json(filterByRadius(restaurants, lat, lng));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new restaurant.
const createRest = async (req, res) => {
    try {
        const {
            name, description, location, category, phone,
            openHours, isPromoted, rating, image, deliveryFee, deliveryTime,
        } = req.body;

        const missingFields = [];
        if (!name) missingFields.push('Name');
        if (!location || !location.lat || !location.lng) missingFields.push('Location (lat & lng)');
        if (!category) missingFields.push('Category');
        if (missingFields.length > 0) {
            return res.status(400).json({ error: `${missingFields.join(', ')} is required` });
        }

        const newRest = await Restaurant.create({
            name,
            description:  description  || '',
            location,
            category,
            phone:        phone        || '',
            openHours:    openHours    || '',
            isPromoted:   isPromoted   || false,
            rating:       rating       || 0,
            image:        image        || '',
            deliveryFee:  deliveryFee  || 0,
            deliveryTime: deliveryTime || 30,
            ownerId:      req.userId,
        });

        res.setHeader('Location', `/api/restaurants/${newRest.id}`);
        res.status(201).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Retrieve a specific restaurant by its ID.
const getRest = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        res.status(200).json(restaurant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an existing restaurant's details.
const updateRest = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: Only the owner can update this restaurant' });
        }

        // Strip fields that must never be overwritten by the caller.
        const { ownerId, id, _id, ...allowedUpdates } = req.body;
        await Restaurant.findByIdAndUpdate(req.params.id, allowedUpdates, { runValidators: true });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a restaurant and cascade-delete its products.
const deleteRest = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: Only the owner can delete this restaurant' });
        }

        await restaurantsService.remove(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Return all products for a restaurant grouped into menu sections.
// Products are still in-memory until SCRUM-417; queried by restId.
const getMenu = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        const products = productsRepo.findBy(p => p.restId === req.params.id);

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fetch recommended restaurants via the legacy Ex2 TCP client, filtered by radius.
// Orders are still in-memory until Dana migrates them (SCRUM-486/487).
const getRecomRests = async (req, res) => {
    const { lat, lng } = req.query;

    const fallback = async () => {
        const all = await Restaurant.find();
        return filterByRadius(all, lat, lng).slice(0, 5);
    };

    try {
        const userOrders = ordersRepo.findAll().filter(o => o.userId === req.userId);

        if (userOrders.length === 0) {
            return res.status(200).json(await fallback());
        }

        const lastOrder = userOrders[userOrders.length - 1];
        const recommendedIds = await getRecommendations(req.userId, lastOrder.restaurantId);

        const recomRests = (
            await Promise.all(recommendedIds.map(id => Restaurant.findById(id)))
        ).filter(Boolean);

        const filtered = filterByRadius(recomRests, lat, lng).slice(0, 5);

        if (filtered.length === 0) return res.status(200).json(await fallback());
        res.status(200).json(filtered);
    } catch (err) {
        console.error('Error fetching recommendations:', err);
        res.status(200).json(await fallback());
    }
};

module.exports = {
    getRestaurants,
    createRest,
    getRest,
    updateRest,
    deleteRest,
    getMenu,
    getRecomRests,
};
