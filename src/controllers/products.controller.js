const productsRepo = require('../services/repositories/products.repository');
const restRepo = require('../services/repositories/restaurants.repository');
const { recordView } = require('../services/tcpClient');
const jwt = require('jsonwebtoken');

// --- Helper Function: Calculate Section Order ---
const calcSectionOrder = (section) => {
    const normalized = section.trim();
    
    if (normalized === 'Starters') {
        return 1;
    }
    if (normalized === 'Drinks' || normalized === 'Beverages') {
        return 3; 
    }
    
    // Everything else gets priority 2. 
    // They will be sorted alphabetically by ASCII later.
    return 2;
};

// Retrieve all products belonging to a specific restaurant.
const getAllProducts = (req, res) => {
    const { id } = req.params;      // Restaurant ID from the parent route.
    const products = productsRepo.findBy(p => p.restId === id);

    // Sort the products before returning them to the frontend.
    products.sort((a, b) => {
        // First priority: sort by the assigned section number (1, 2, or 3)
        if (a.sectionOrder !== b.sectionOrder) {
            return a.sectionOrder - b.sectionOrder;
        }
        // Second priority: if they have the same number, sort by ASCII string value
        return a.section.localeCompare(b.section);
    });

    res.status(200).json(products);
};

// Add a new product to a specific restaurant's menu.
const createProduct = (req,res) => {
    const { id } = req.params;      // Restaurant ID.
    const { 
        name, description, price, isAvailable, 
        image, section, sectionOrder
    } = req.body;

    // Validation for mandatory data.
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (price === undefined) missingFields.push("Price");
    if (!section) missingFields.push("Section");

    if (missingFields.length > 0) {
        return res.status(400).json({ error: `${missingFields.join(', ')} is required` });
    }

    // Ensure the target restaurant actually exists before adding a product.
    const restaurant = restRepo.findById(id);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    // Ensure that the user trying to create a product is the restaurant's owner.
    if (restaurant.ownerId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the restaurant owner can add products" });
    }

    const calculatedSectionOrder = calcSectionOrder(section);

    // Building the new object's data.
    const newProdData = {
        name,
        description: description || "",
        price,
        section,
        // If not mentioned otherwise, assume the product is available.
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        image: image || "",
        restId: id, // Will be used to link the product to a restaurant.
        sectionOrder: calculatedSectionOrder
    };

    // Create the product.
    const newProduct = productsRepo.create(newProdData);
    res.setHeader('Location', `/api/restaurants/${id}/products/${newProduct.id}`);
    res.status(201).send();
};

// Retrieve a specific product by its product ID (pid).
const getProduct = (req,res) => {
    const { pid } = req.params;
    const product = productsRepo.findById(pid);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    // Attempt to securely extract the user ID from the JWT
    const authHeader = req.headers['authorization'];
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key'); 
            
            // Adjust 'id' if your token payload uses a different key (e.g., decoded.userId).
            userId = decoded.id; 
        } catch (err) {
            // Token is invalid or expired. We ignore it and treat the request as a guest view.
        }
    }

    // Log the view to the Ex2 C++ server asynchronously if the user is logged in.
    if (userId) {
        recordView(userId, pid);
    }
    res.status(200).json(product);
};

// Update a specific product's details.
const updateProduct = (req,res) => {
    const { pid } = req.params;

    // Find the product in DB.
    const product = productsRepo.findById(pid);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    // Find the restaurant this product belongs to, and check for the owner.
    const restaurant = restRepo.findById(product.restId);
    if (!restaurant || restaurant.ownerId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the restaurant owner can update this product" });
    }

    // Update the product (only the editable fields).
    const { restId, id: bodyId, ...allowedUpdates } = req.body;

    if (allowedUpdates.section) {
        allowedUpdates.sectionOrder = calcSectionOrder(allowedUpdates.section);
    }

    productsRepo.update(pid, allowedUpdates);
    res.status(204).send();
};

// Delete a specific product from the database.
const deleteProduct = (req, res) => {
    const { pid } = req.params;

    // Find the product in DB.
    const product = productsRepo.findById(pid);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    // Find the restaurant this product belongs to, and check for the owner.
    const restaurant = restRepo.findById(product.restId);
    if (!restaurant || restaurant.ownerId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: Only the restaurant owner can update this product" });
    }

    // Delete the product.
    productsRepo.remove(pid);
    res.status(204).send();
};

module.exports = {
    getAllProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct
}