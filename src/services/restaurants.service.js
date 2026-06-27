'use strict';

const Restaurant = require('../models/Restaurant');
const productsRepo = require('./repositories/products.repository');

// Delete a restaurant and cascade-delete its products.
// Products are still in the in-memory repo until SCRUM-417 migrates them;
// at that point replace the productsRepo block with:
//   const Product = require('../models/Product');
//   await Product.deleteMany({ restaurantId: id });
async function remove(id) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return false;

    // Phase 1 — collect dependent products (in-memory, until SCRUM-417).
    const productsToRemove = productsRepo.findBy(p => p.restId === id || p.restaurantId === id);

    // Phase 2 — execute deletions.
    for (const p of productsToRemove) productsRepo.remove(p.id);
    await Restaurant.findByIdAndDelete(id);

    return true;
}

module.exports = { remove };
