'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { request, withServer } = require('../test-utils/http');
const app = require('../src/app');

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

// --- New entity stub surfaces (501) -------------------------------------
// Only assert 501 on entities not yet implemented: products / orders / search.
// Users + restaurants + tokens already have working implementations and
// must keep returning their real responses — see test/app.test.js and the
// Acceptance Criteria in docs/sdd/SCRUM-183-mvc-layout.md.

const stubEndpoints = ['/api/products', '/api/orders', '/api/search'];

for (const path of stubEndpoints) {
  for (const method of ['GET', 'POST']) {
    test(`${method} ${path} returns 501 Not implemented`, async () => {
      await withServer(app, async (server) => {
        const body = method === 'POST' ? {} : undefined;
        const res = await request(server, method, path, body);
        assert.equal(res.status, 501, `${method} ${path} should be 501`);
        assert.deepEqual(res.body, { error: 'Not implemented' });
      });
    });
  }
}
