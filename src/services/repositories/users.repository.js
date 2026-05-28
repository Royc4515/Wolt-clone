'use strict';

// Singleton repository for users. Every `require` returns the same
// instance — the in-memory equivalent of a connection pool. Services
// depend on this module to read/write user records.
const { createRepository } = require('./baseRepository');

module.exports = createRepository();
