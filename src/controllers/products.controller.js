const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const ordersRepo = require('../services/repositories/orders.repository');
const { recordView, getRecommendations } = require('../services/tcpClient');
const jwt = require('jsonwebtoken');

const calcSectionOrder = (section) => {
    const normalized = section.trim();
    if (normalized === 'Starters') return 1;
    if (normalized === 'Drinks' || normalized === 'Beverages') return 3;
    return 2;
};

// Retrieve all products belonging to a specific restaurant.
const getAllProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const products = await Product.find({ restaurantId: id }).sort({ sectionOrder: 1, section: 1 });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add a new product to a specific restaurant's menu.
const createProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, isAvailable, image, section } = req.body;

        const missingFields = [];
        if (!name) missingFields.push('Name');
        if (price === undefined) missingFields.push('Price');
        if (!section) missingFields.push('Section');
        if (missingFields.length > 0) {
            return res.status(400).json({ error: `${missingFields.join(', ')} is required` });
        }

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: Only the restaurant owner can add products' });
        }

        const newProduct = await Product.create({
            name,
            description:  description || '',
            price,
            section,
            sectionOrder: calcSectionOrder(section),
            isAvailable:  isAvailable !== undefined ? isAvailable : true,
            image:        image || '',
            restaurantId: id,
        });

        res.setHeader('Location', `/api/restaurants/${id}/products/${newProduct.id}`);
        res.status(201).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Retrieve a specific product by its product ID (pid).
const getProduct = async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Extract userId from JWT if present, then log the view asynchronously.
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                if (decoded.id) recordView(decoded.id, pid);
            } catch {
                // Invalid or expired token — treat as guest view, no logging.
            }
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a specific product's details.
const updateProduct = async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const restaurant = await Restaurant.findById(product.restaurantId);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: Only the restaurant owner can update this product' });
        }

        const { restaurantId, id, _id, ...allowedUpdates } = req.body;
        if (allowedUpdates.section) {
            allowedUpdates.sectionOrder = calcSectionOrder(allowedUpdates.section);
        }

        await Product.findByIdAndUpdate(pid, allowedUpdates, { runValidators: true });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a specific product.
const deleteProduct = async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const restaurant = await Restaurant.findById(product.restaurantId);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: Only the restaurant owner can delete this product' });
        }

        await Product.findByIdAndDelete(pid);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fetch recommended products specific to a requested restaurant.
const getRecomProds = async (req, res) => {
    const userId = req.userId;
    const restaurantId = req.params.id;

    const fallback = async () => {
        const prods = await Product.find({ restaurantId }).limit(5);
        return prods;
    };

    const allOrders = ordersRepo.findAll();
    const userOrders = allOrders.filter(o => o.userId === userId);

    if (userOrders.length === 0) {
        return res.status(200).json(await fallback());
    }

    const lastOrder = userOrders[userOrders.length - 1];
    const targetProductId = lastOrder.items[0]?.productId;
    if (!targetProductId) {
        return res.status(200).json(await fallback());
    }

    try {
        const recommendedIds = await getRecommendations(userId, targetProductId);
        const recomProds = (
            await Promise.all(recommendedIds.map(id => Product.findById(id)))
        ).filter(Boolean);

        const filtered = recomProds.filter(p => p.restaurantId === restaurantId);
        if (filtered.length === 0) return res.status(200).json(await fallback());

        res.status(200).json(filtered.slice(0, 5));
    } catch {
        res.status(200).json(await fallback());
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    getRecomProds,
};
