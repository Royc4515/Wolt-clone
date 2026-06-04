'use strict';

const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// In case of an empty search, return empty lists of restaurants and products.
router.get('/', (req, res) => {
    res.status(200).json({
        restaurants: [],
        products: []
    });
});

// If query is not empty, call 'searchAll()'.
router.get('/:query', searchController.searchAll);

module.exports = router;
