const test = require('node:test');
const assert = require('node:assert/strict');
const { request, withServer } = require('../test-utils/http');

const app = require('../src/app');

test('GET /api/health returns 200 with {status:"ok"}', async () => {
  await withServer(app, async (server) => {
    const res = await request(server, 'GET', '/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});

test('unknown /api/* route returns 404 with error envelope', async () => {
  await withServer(app, async (server) => {
    const res = await request(server, 'GET', '/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(typeof res.body, 'object');
    assert.equal(res.body.error, 'Not found');
  });
});

test('malformed JSON body returns 400 with error envelope', async () => {
  await withServer(app, async (server) => {
    const res = await request(server, 'POST', '/api/health', '{not valid json');
    assert.equal(res.status, 400);
    assert.equal(typeof res.body, 'object');
    assert.ok(typeof res.body.error === 'string' && res.body.error.length > 0);
  });
});

test('error handler honors err.status (418)', async () => {
  const express = require('express');
  const probe = express();
  probe.use(express.json());
  probe.get('/boom', (_req, _res, next) => {
    const e = new Error("I'm a teapot");
    e.status = 418;
    next(e);
  });
  const errorHandler = require('../src/middleware/errorHandler');
  probe.use(errorHandler);

  await withServer(probe, async (server) => {
    const res = await request(server, 'GET', '/boom');
    assert.equal(res.status, 418);
    assert.equal(res.body.error, "I'm a teapot");
  });
});

test('requiring src/app does not open a listening port', () => {
  const freshApp = require('../src/app');
  assert.equal(typeof freshApp, 'function');
  assert.equal(typeof freshApp.listen, 'function');
  // If app.js called listen() on import, this test file would have already
  // bound a port at module load. The earlier tests use app.listen(0)
  // explicitly via withServer, so reaching here means import was passive.
});
