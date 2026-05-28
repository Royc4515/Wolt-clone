'use strict';

// Singleton repository for orders. Orders are historical records —
// they survive the deletion of the user that placed them by design
// (see SDD §5.2).
const { createRepository } = require('./baseRepository');

module.exports = createRepository();
