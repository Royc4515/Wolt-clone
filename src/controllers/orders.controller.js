const ordersRepo = require('../services/repositories/orders.repository');
const restRepo = require('../services/repositories/restaurants.repository');
const prodRepo = require('../services/repositories/products.repository');

// Create a new order.
const createOrder = (req, res) => {
    // Verify user is logged in via header.
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID missing" });
    }

    const { restaurantId, items } = req.body;

    // Validate input structure.
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "restaurant's id and a non-empty items array are required" });
    }

    // Verify that restaurant exists.
    const restaurant = restRepo.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    let totalPrice = 0;

    // Validate each product in the order.
    for (const it of items) {
        const product = prodRepo.findById(it.productId);

        if (!product) {
            return res.status(400).json({ error: `Product ${it.productId} not found` });
        }

        // Ensure the product actually belongs to the chosen restaurant.
        if (product.restId !== restaurantId) {
            return res.status(400).json({ error: `Product ${it.productId} does not belong to this restaurant` });
        }

        // Calculate total price (default quantity to 1 if not provided)
        const quantity = it.quantity || 1;
        totalPrice += (product.price || 0) * quantity;
    }

    // Create and save the order.
    const newOrderdata = {
        userId,
        restaurantId,
        items,
        totalPrice,
        status: "pending",      // Default status to a new order.
        createdAt: new Date().toISOString()
    };

    const newOrder = ordersRepo.create(newOrderdata);
    res.status(201).json({ id: newOrder.id });
};

// Fetch all orders for the logged-in user.
const getOrders = (req, res) => {
    // Verify user is logged in via header.
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User ID missing" });
    }

    // Fetch all orders from the DB.
    const allOrders = ordersRepo.findAll();

    // Filter orders to include only those belonging to the logged-in user.
    const userOrders = allOrders.filter(order => order.userId === userId);

    // Return the user's orders (or an empty array if there's none).
    res.status(200).json(userOrders);
};

module.exports = {
    createOrder,
    getOrders
};