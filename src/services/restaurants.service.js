'use strict';

const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');

async function remove(id) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return false;

    await Product.deleteMany({ restaurantId: id });
    await Restaurant.findByIdAndDelete(id);

    return true;
}

module.exports = { remove };
