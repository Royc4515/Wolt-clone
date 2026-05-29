const productsRepo = require('../services/repositories/products.repository');
const reastRepo = require('../services/repositories/restaurants.repository');

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
    const { name } = req.body;

    // Validate that the product name is provided.
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    // Ensure the target restaurant actually exists before adding a product.
    const restaurant = reastRepo.findById(id);
    if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
    }

    // Create the product and link it to the restaurant via restId.
    const newProduct = productsRepo.create({ ...req.body, restId: id });
    res.status(201).json({ id: newProduct.id });
};

// Retrieve a specific product by its product ID (pid).
const getProduct = (req,res) => {
    const { pid } = req.params;
    const product = productsRepo.findById(pid);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
};

// Update a specific product's details.
const updateProduct = (req,res) => {
    const { pid } = req.params;
    const updateProd = productsRepo.update(pid, req.body);

    if (!updateProd) {
        return res.status(404).json({ error: "Product not found" });
    }
    // Respond with 204 No Content on successful update.
    res.status(204).send();
};

// Delete a specific product from the database.
const deleteProduct = (req, res) => {
    const { pid } = req.params;
    const isDeleted = productsRepo.remove(pid);
    if (!isDeleted) {
        return res.status(404).json({ error: "Product not found" });
    }
    // Respond with 204 No Content on successful deletion.
    res.status(204).send();
};

module.exports = {
    getAllProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct
}