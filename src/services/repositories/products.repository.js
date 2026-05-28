'use strict';

// Singleton repository for products. Each product entity carries a
// `restaurantId` foreign-key field; the restaurants service uses
// `findBy(p => p.restaurantId === id)` to drive the cascade delete.
const { createRepository } = require('./baseRepository');

module.exports = createRepository();
