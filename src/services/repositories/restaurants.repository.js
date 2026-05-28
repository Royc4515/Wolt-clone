'use strict';

// Singleton repository for restaurants. The restaurants service uses this
// together with `products.repository` to drive the cascade delete
// (deleting a restaurant cascades to all of its products — see SDD §5.1).
const { createRepository } = require('./baseRepository');

module.exports = createRepository();

