const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const { calcAerialDistance } = require('../services/distance');

// Create a new order with secure backend calculations and radius limitation.
const createOrder = async (req, res) => {
    try {
        // req.user is set by the requireAuth middleware
        const userId = req.user.id; 
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

        // Verify that restaurant exists in MongoDB.
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        let subtotal = 0;
        let totalItemsCount = 0;
        const enrichedItems = [];

        // Securely calculate subtotal based on database prices, not user input.
        for (const it of items) {
            const product = await Product.findById(it.productId);

            if (!product) {
                return res.status(400).json({ error: `Product ${it.productId} not found` });
            }

            // Ensure the product actually belongs to the chosen restaurant.
            if (product.restaurantId !== restaurantId) {
                return res.status(400).json({ error: `Product ${it.productId} does not belong to this restaurant` });
            }

            // Calculate total price (default quantity to 1 if not provided)
            const quantity = it.quantity || 1;
            subtotal += product.price * quantity;
            totalItemsCount += quantity;

            // Enrich item data to be saved as a snapshot in the Order document
            enrichedItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity
            });
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

            // Define the maximum allowed delivery distance in kilometers.
            const MAX_DELIVERY_RADIUS_KM = 15; 
            
            // Block the order if the distance exceeds the maximum radius.
            if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
                return res.status(400).json({ 
                    error: `Delivery address is too far. Maximum delivery distance is ${MAX_DELIVERY_RADIUS_KM}km. (Your distance: ${distanceKm.toFixed(1)}km)` 
                });
            }

            finalDeliveryFee = restaurant.deliveryFee + (distanceKm * 2); // 2 ILS per km.
            estimatedTime = restaurant.deliveryTime + (totalItemsCount * 2) + Math.round(distanceKm * 3); // Restaurant's base time + 2 min per item + 3 min per km.
        } else {
            finalDeliveryFee = 0;
            estimatedTime = 15 + (totalItemsCount * 2); // 15 min + 2 min per item.
        }

        const finalTip = typeof tip === 'number' ? tip : 0;
        const finalTotal = subtotal + SERVICE_FEE + finalDeliveryFee + finalTip;

        // Create and save the order in MongoDB.
        const newOrder = await Order.create({
            userId,
            restaurantId,
            items: enrichedItems,
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
            status: "pending",
            statusHistory: [{ status: 'pending', timestamp: new Date() }]
        });

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch all orders for the logged-in user.
const getAllOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all orders belonging to the user from DB, sorted by newest first
        const userOrders = await Order.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(userOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve a specific order by its ID.
const getOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const order = await Order.findById(id);

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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an existing order.
const updateOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const order = await Order.findById(id);

        // Check if the order exists.
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Ensure the order actually belongs to the requesting user.
        if (order.userId !== userId) {
            return res.status(403).json({ error: "Forbidden: You cannot update another user's order" });
        }

        // Security: Prevent Mass Assignment by extracting sensitive fields out.
        const { 
            userId: bodyUserId, 
            restaurantId, 
            pricing, 
            id: bodyId, 
            createdAt,
            ...allowedUpdates 
        } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(id, allowedUpdates, { new: true });
        
        // Return 200 OK with the updated order object.
        return res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a specific order.
const deleteOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const order = await Order.findById(id);

        // Check if the order exists.
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Ensure the order actually belongs to the requesting user.
        if (order.userId !== userId) {
            return res.status(403).json({ error: "Forbidden: You cannot access another user's order" });
        }

        // Delete the order.
        await Order.findByIdAndDelete(id);
        
        res.status(200).json({ 
            message: "Order successfully cancelled", 
            deletedOrderId: id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update the status of an existing order (Restaurant Admin only).
const updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status field is required" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Verify that the user attempting to update the status is the owner of the restaurant.
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: "Associated restaurant not found" });
        }

        if (restaurant.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden: Only the restaurant owner can update order statuses" });
        }

        // Update the status and record the timestamp in history.
        order.status = status;
        order.statusHistory.push({ status, timestamp: new Date() });
        const updatedOrder = await order.save();

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch all orders for a specific restaurant (Restaurant Admin only).
const getRestaurantOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { restaurantId } = req.params;

        // Verify that the restaurant exists in the DB.
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        // Security check: Ensure the requesting user is the actual owner of this restaurant.
        if (restaurant.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden: Only the restaurant owner can view these orders" });
        }

        // Fetch all orders matching this restaurant ID.
        const restaurantOrders = await Order.find({ restaurantId }).sort({ createdAt: -1 });

        res.status(200).json(restaurantOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getRestaurantOrders
};