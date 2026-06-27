'use strict';

const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');

const searchAll = async (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const regex = new RegExp(query, 'i');

        const [restaurants, products] = await Promise.all([
            Restaurant.find({
                $or: [{ name: regex }, { description: regex }, { category: regex }],
            }),
            Product.find({
                $or: [{ name: regex }, { description: regex }],
            }),
        ]);

        res.status(200).json({ restaurants, products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { searchAll };
