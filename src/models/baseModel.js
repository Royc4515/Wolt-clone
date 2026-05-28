'use strict';

const { randomUUID } = require('node:crypto');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function validate(input, requiredFields = []) {
  if (!isPlainObject(input)) {
    return { ok: false, errors: ['Input must be an object'] };
  }

  const errors = [];
  for (const field of requiredFields) {
    if (isMissing(input[field])) {
      errors.push(`${field} is required`);
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

function create(input, requiredFields = []) {
  const result = validate(input, requiredFields);
  if (!result.ok) return result;
  return { ok: true, value: { id: randomUUID(), ...input } };
}

module.exports = { validate, create };
