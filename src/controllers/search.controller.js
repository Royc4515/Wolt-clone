'use strict';

const restRepo = require('../services/repositories/restaurants.repository');
const prodRepo = require('../services/repositories/products.repository');

const searchAll = (req, res) => {
    // Extract the query from params and switch it to lower case.
    const query = req.params.query.toLowerCase();

    // Extract all restaurants and all products from DB.
    const allRests = restRepo.findAll();
    const allProds = prodRepo.findAll();

    // Filter all restaurants that include the query in their name\desfription.
    const matchRests = allRests.filter(rest => {
        // Turn the name to lower case.
        const lowerName = rest.name.toLowerCase();

        // Check if the query is in the name.
        if (lowerName.includes(query)) {
            return true;
        }

        // Ensure that there's a description.
        if (rest.description) {
            // Turn the description to lower case.
            const lowerDesc = rest.description.toLowerCase();

            // Check if the query is in the description.
            if (lowerDesc.includes(query)) {
                return true;
            }
        }

        // If not found, return false.
        return false;
    });

    // Filter all products that include the query in their name\desfription.
    const matchProds = allProds.filter(prod => {
        // Turn the name to lower case.
        const lowerName = prod.name.toLowerCase();

        // Check if the query is in the name.
        if (lowerName.includes(query)) {
            return true;
        }

        // Ensure that there's a description.
        if (prod.description) {
            // Turn the description to lower case.
            const lowerDesc = prod.description.toLowerCase();

            // Check if the query is in the description.
            if (lowerDesc.includes(query)) {
                return true;
            }
        }

        // If not found, return false.
        return false;
    });

    // Return the list of restaurants and products found for this query.
    res.status(200).json({
        Restaurants: matchRests,
        Products: matchProds
    });
};

module.exports = {
    searchAll
};