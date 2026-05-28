'use strict';

const { randomUUID } = require('node:crypto');

// Factory returning a repository instance with the Map kept in a closure.
// Nothing outside the returned API can mutate the store directly — this
// is the encapsulation boundary that lets us swap the in-memory backing
// for MongoDB (Ex4+) without touching any caller.
//
// Contract — see docs/sdd/SCRUM-184-repositories.md §3.
function createRepository() {
  const store = new Map();

  return {
    findAll() {
      return [...store.values()];
    },

    findById(id) {
      return store.get(id);
    },

    findBy(predicate) {
      const result = [];
      for (const entity of store.values()) {
        if (predicate(entity)) result.push(entity);
      }
      return result;
    },

    create(data) {
      // Repo trusts its caller — validation lives in models/. Any `id`
      // present in `data` is overwritten so the repo always owns id
      // assignment (see SDD §3 — id immutability, §4 — UUID v4).
      const id = randomUUID();
      const entity = { ...data, id };
      store.set(id, entity);
      return entity;
    },

    update(id, patch) {
      const existing = store.get(id);
      if (!existing) return null;
      // `id` is immutable: even if the caller passes one in the patch,
      // we re-pin the real id at the end of the spread.
      const updated = { ...existing, ...patch, id };
      store.set(id, updated);
      return updated;
    },

    remove(id) {
      // Map.delete returns true on hit, false on miss — exactly the
      // shape the SDD requires, and naturally idempotent.
      return store.delete(id);
    },
  };
}

module.exports = { createRepository };
