const productsRepo = require('../services/repositories/products.repository');
const restRepo = require('../services/repositories/restaurants.repository');
const { recordView } = require('../services/tcpClient');

// Retrieve all products belonging to a specific restaurant.
const getAllProducts = (req, res) => {
    const { id } = req.params;      // Restaurant ID from the parent route.

    // Find products where the restId matches the given restaurant ID.
    const products = productsRepo.findBy(p => p.restId === id);
    res.status(200).json(products);
};

// Add a new product to a specific restaurant's menu.
const createProduct = (req,res) => {
    const { id } = req.params;      // Restaurant ID.
    const { name, description, price, isAvailable, category } = req.body;

    // Validation for mandatory data.
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (price === undefined) missingFields.push("Price");
    if (!category) missingFields.push("Category");

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

    // Building the new object's data.
    const newProdData = {
        name,
        description: description || "",
        price,
        category,
        // If not mentioned otherwise, assume the product is available.
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        restId: id // Will be used to link the product to a restaurant.
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
    const userId = req.headers['x-user-id'];

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
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

    // Update the product.
    productsRepo.update(pid, req.body);
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