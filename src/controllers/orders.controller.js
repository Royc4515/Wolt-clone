const ordersRepo = require('../services/repositories/orders.repository');
const restRepo = require('../services/repositories/restaurants.repository');
const prodRepo = require('../services/repositories/products.repository');
const { calcAerialDistance } = require('../services/distance');

// Create a new order with secure backend calculations.
const createOrder = (req, res) => {
    const userId = req.userId;
    const { 
        restaurantId, items, mode, paymentMethod, 
        cutlery, notes, location, tip
    } = req.body;

    // Ensure there are no missing fields.
    const missingFields = [];
    if (!restaurantId) missingFields.push("Restaurant ID");
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push("Items");
    if (!mode || (mode !== 'delivery' && mode !== 'pickup')) missingFields.push("Mode (delivery/pickup)");
    if (!paymentMethod) missingFields.push("Payment Method");
    if (mode === 'delivery' && (!location || !location.lat || !location.lng)) missingFields.push("Delivery Destination");

    if (missingFields.length > 0) {
        return res.status(400).json({ error: `${missingFields.join(', ')} is required` });
    }

    // Verify that restaurant exists.
    const restaurant = restRepo.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    let subtotal = 0;
    let totalItemsCount = 0;

    // Securely calculate subtotal based on database prices, not user input.
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
        subtotal += product.price * quantity;
        totalItemsCount += quantity;
    }

    const SERVICE_FEE = 2.00;
    let finalDeliveryFee = 0;
    let estimatedTime = 0;

    // Calculate dynamic delivery fee and estimated time based on distance.
    if (mode === 'delivery') {
        const distanceKm = calcAerialDistance(
            restaurant.location.lat, restaurant.location.lng,
            location.lat, location.lng
        );

        finalDeliveryFee = restaurant.deliveryFee + (distanceKm * 2); // 2 ILS per km.
        estimatedTime = restaurant.deliveryTime + (totalItemsCount * 2) + Math.round(distanceKm * 3); // Restaurant's base time + 2 min per item + 3 min per km.
    } else {
        finalDeliveryFee = 0;
        estimatedTime = 15 + (totalItemsCount * 2); // 15 min + 2 min per item.
    }

    const finalTip = typeof tip === 'number' ? tip : 0;
    const finalTotal = subtotal + SERVICE_FEE + finalDeliveryFee + finalTip;

    // Create and save the order.
    const newOrderdata = {
        userId,
        restaurantId,
        items,
        mode,
        paymentMethod,
        cutlery: cutlery || 0,
        notes: notes || "",
        location: mode === 'delivery' ? location : null,
        tip: finalTip,
        pricing: {
            subtotal,
            serviceFee: SERVICE_FEE,
            deliveryFee: Number(finalDeliveryFee.toFixed(2)),
            finalTip,
            total: Number(finalTotal.toFixed(2))
        },
        estimatedTime,
        status: "pending",      // Default status to a new order.
        createdAt: new Date().toISOString()
    };

    const newOrder = ordersRepo.create(newOrderdata);
    res.setHeader('Location', `/api/orders/${newOrder.id}`);
    res.status(201).json(newOrder);
};

// Fetch all orders for the logged-in user.
const getAllOrders = (req, res) => {
    const userId = req.userId;

    // Fetch all orders from the DB.
    const allOrders = ordersRepo.findAll();

    // Filter orders to include only those belonging to the logged-in user.
    const userOrders = allOrders.filter(order => order.userId === userId);

    // Return the user's orders (or an empty array if there's none).
    res.status(200).json(userOrders);
};

// Retrieve a specific order by its ID.
const getOrder = (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const order = ordersRepo.findById(id);

    // Check if the order exists in the DB.
    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    // Ensure the order actually belongs to the requesting user.
    if (order.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You cannot access another user's order" });
    }

    // Return the order.
    res.status(200).json(order);
};

// Update an existing order.
const updateOrder = (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const order = ordersRepo.findById(id);

    // Check if the order exists.
    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    // Ensure the order actually belongs to the requesting user.
    if (order.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You cannot access another user's order" });
    }

    // Security: Prevent Mass Assignment by extracting sensitive fields out.
    // The user should not be able to modify the core identity or pricing of the order.
    const { 
        userId: bodyUserId, 
        restaurantId, 
        pricing, 
        id: bodyId, 
        createdAt,
        ...allowedUpdates 
    } = req.body;

    const updatedOrder = ordersRepo.update(id, allowedUpdates);
    
    if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found during update" });
    }

    // Return 200 OK with the updated order object.
    return res.status(200).json(updatedOrder);
};

// Delete a specific order.
const deleteOrder = (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const order = ordersRepo.findById(id);

    // Check if the order exists.
    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    // Ensure the order actually belongs to the requesting user.
    if (order.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You cannot access another user's order" });
    }

    // Delete the order.
    ordersRepo.remove(id);
    
    // Return 200 OK with a JSON confirmation instead of 204 No Content.
    res.status(200).json({ 
        message: "Order successfully cancelled", 
        deletedOrderId: id 
    });
};

// Update the status of an existing order (Restaurant Admin only).
const updateOrderStatus = (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    // Validate input.
    if (!status) {
        return res.status(400).json({ error: "Status field is required" });
    }

    // Check if the order exists.
    const order = ordersRepo.findById(id);
    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    // Verify that the user attempting to update the status is the owner of the restaurant.
    const restaurant = restRepo.findById(order.restaurantId);
    if (!restaurant) {
        return res.status(404).json({ error: "Associated restaurant not found" });
    }

    if (restaurant.ownerId !== userId) {
        return res.status(403).json({ error: "Forbidden: Only the restaurant owner can update order statuses" });
    }

    // Update the status in the database.
    const updatedOrder = ordersRepo.update(id, { status });

    if (!updatedOrder) {
         return res.status(500).json({ error: "Failed to update order status" });
    }

    // Return 200 and the updated status upon successful update.
    res.status(200).json(updatedOrder);
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus
};