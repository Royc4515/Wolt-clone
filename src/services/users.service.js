'use strict';

// Minimal users service for SCRUM-184: only the `remove` operation, to
// demonstrate the negative-cascade rule (orders survive a user delete).
// Full CRUD lands in the per-entity migration ticket (see SDD §11).
const usersRepo = require('./repositories/users.repository');

// Orders are historical records and MUST NOT cascade with the user that
// placed them (SDD §5.2). This is a business invariant — keeping it in
// the service layer makes the rule visible and testable, rather than
// hiding it inside the user repo.
function remove(id) {
  return usersRepo.remove(id);
}

module.exports = { remove };
