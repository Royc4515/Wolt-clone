'use strict';

// Minimal restaurants service for SCRUM-184: just the `remove` operation,
// which orchestrates the cascade delete of dependent products. Full CRUD
// and the Ex2 TCP integration land in the per-entity migration ticket
// (see SDD §11 — Follow-up Tickets).
const restaurantsRepo = require('./repositories/restaurants.repository');
const productsRepo = require('./repositories/products.repository');

// Collect-then-Execute (SDD §5.3 Pattern A): we read everything we need
// before any mutation, so a throw during the decision phase leaves the
// store unchanged. The same shape will survive the future MongoDB swap
// by wrapping Phase 2 in session.withTransaction.
function remove(id) {
  // Phase 1 — collect (read-only).
  const restaurant = restaurantsRepo.findById(id);
  if (!restaurant) return false;
  const productsToRemove = productsRepo.findBy((p) => p.restaurantId === id);

  // Phase 2 — execute (mutations only, no further decisions).
  for (const product of productsToRemove) productsRepo.remove(product.id);
  return restaurantsRepo.remove(id);
}

module.exports = { remove };
