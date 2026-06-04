'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Lazy require so module-load failure on baseModel doesn't abort the whole
// suite. Each baseModel test fails independently with a clear message during
// the Red phase, before src/models/baseModel.js exists.
function loadBaseModel() {
  return require('../src/models/baseModel');
}

// --- baseModel.validate contract ----------------------------------------

test('baseModel.validate rejects an empty object when "name" is required', () => {
  const baseModel = loadBaseModel();
  const result = baseModel.validate({}, ['name']);
  assert.equal(result.ok, false);
  assert.ok(Array.isArray(result.errors), 'errors must be an array');
  assert.ok(result.errors.length > 0, 'errors must list at least one missing field');
  assert.ok(
    result.errors.some((e) => /name/i.test(String(e))),
    'errors must mention the missing "name" field',
  );
});

test('baseModel.validate accepts input when all required fields are present', () => {
  const baseModel = loadBaseModel();
  const result = baseModel.validate({ name: 'aaa' }, ['name']);
  assert.equal(result.ok, true);
});

test('baseModel.validate rejects non-object input', () => {
  const baseModel = loadBaseModel();
  const result = baseModel.validate(null, ['name']);
  assert.equal(result.ok, false);
  assert.ok(Array.isArray(result.errors) && result.errors.length > 0);
});
