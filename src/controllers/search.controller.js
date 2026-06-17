'use strict';

const restRepo = require('../services/repositories/restaurants.repository');
const prodRepo = require('../services/repositories/products.repository');

const searchAll = (req, res) => {
    // Extract the query from params and switch it to lower case.
    const query = req.params.query.toLowerCase();

    // Extract all restaurants and all products from DB.
    const allRests = restRepo.findAll();
    const allProds = prodRepo.findAll();

    // Filter all restaurants that include the query in their name/description/category.
    const matchRests = allRests.filter(rest => {
        const lowerName = rest.name ? rest.name.toLowerCase() : '';
        const lowerDesc = rest.description ? rest.description.toLowerCase() : '';
        const lowerCat = rest.category ? rest.category.toLowerCase() : '';

        if (lowerName.includes(query) || lowerDesc.includes(query) || lowerCat.includes(query)) {
            return true;
        }
        return false;
    });

    // Filter all products that include the query in their name/description.
    const matchProds = allProds.filter(prod => {
        const lowerName = prod.name ? prod.name.toLowerCase() : '';
        const lowerDesc = prod.description ? prod.description.toLowerCase() : '';

        if (lowerName.includes(query) || lowerDesc.includes(query)) {
            return true;
        }
        return false;
    });

    // Return the list with LOWERCASE keys to match the empty search route behavior
    res.status(200).json({
        restaurants: matchRests,
        products: matchProds
    });
};

module.exports = {
    searchAll
};