'use strict';

// SCRUM-209 — Isolated unit tests for the legacy TCP recommendation bridge.
//
// Verifies the bridge component in COMPLETE ISOLATION from the real C++ Ex2
// server: a `net.createServer()` mock stands in for it. We assert:
//   1. Graceful handling of an offline server (no crash, no throw).
//   2. New-user happy path: POST -> 201 -> { created }, PATCH never sent.
//   3. Existing-user fallback: POST -> 404 -> PATCH -> 204 -> { updated }.
//   4. Both refused: POST 404 -> PATCH 404 -> { rejected }.
//   5. Input validation / protocol-injection guard: no socket opened.
//
// Uses only `node:test`, `node:assert/strict`, and `node:net` — no deps.

const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

const { createRecommendationClient } = require('../src/services/tcpClient');

// ---------------------------------------------------------------------------
// Mock Ex2 server helper.
//
// Mirrors the real C++ server (src/Server/Server.cpp): one persistent
// connection, replies per '\n'-terminated command. `replies` is a list of
// response strings handed out in the order commands arrive. Every received
// command line is pushed onto `received` so tests can assert on the protocol.
// ---------------------------------------------------------------------------
function startMockServer(replies) {
  const received = [];
  let connectionCount = 0;

  const server = net.createServer((socket) => {
    connectionCount += 1;
    let buffer = '';
    let replyIndex = 0;

    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.length === 0) continue;
        received.push(line);
        const reply = replies[replyIndex] ?? '400 Bad Request\n';
        replyIndex += 1;
        socket.write(reply);
      }
    });
  });

  return new Promise((resolve) => {
    // Port 0 => OS assigns a free port.
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        port,
        received,
        get connectionCount() {
          return connectionCount;
        },
        close() {
          return new Promise((res) => server.close(res));
        },
      });
    });
  });
}

function clientFor(port) {
  return createRecommendationClient({ host: '127.0.0.1', port, timeoutMs: 1000 });
}

// ---------------------------------------------------------------------------
// 1. Offline server — must not throw, resolves 'unreachable'.
// ---------------------------------------------------------------------------
test('resolves unreachable (no crash) when the server is offline', async () => {
  // Open a server to grab a guaranteed-free port, then close it so the port
  // is definitely refusing connections.
  const mock = await startMockServer([]);
  const { port } = mock;
  await mock.close();

  const { recordView } = clientFor(port);
  const result = await recordView(1, 42);

  assert.deepEqual(result, { ok: false, reason: 'unreachable' });
});

// ---------------------------------------------------------------------------
// 2. New user — POST returns 201, no PATCH fallback.
// ---------------------------------------------------------------------------
test('new user: POST 201 -> created, PATCH never sent', async (t) => {
  const mock = await startMockServer(['201 Created\n']);
  t.after(() => mock.close());
  const { recordView } = clientFor(mock.port);

  const result = await recordView(7, 99);

  assert.deepEqual(result, { ok: true, action: 'created' });
  assert.deepEqual(mock.received, ['POST 7 99']);
});

// ---------------------------------------------------------------------------
// 3. Existing user — POST 404 triggers PATCH fallback, PATCH 204 -> updated.
// ---------------------------------------------------------------------------
test('existing user: POST 404 -> PATCH 204 -> updated', async (t) => {
  const mock = await startMockServer(['404 Not Found\n', '204 No Content\n']);
  t.after(() => mock.close());
  const { recordView } = clientFor(mock.port);

  const result = await recordView(7, 99);

  assert.deepEqual(result, { ok: true, action: 'updated' });
  assert.deepEqual(mock.received, ['POST 7 99', 'PATCH 7 99']);
  // Fallback must reuse the SAME connection (mirrors the real C++ server).
  assert.equal(mock.connectionCount, 1);
});

// ---------------------------------------------------------------------------
// 4. Both refused — POST 404 then PATCH 404 -> rejected with final status.
// ---------------------------------------------------------------------------
test('both refused: POST 404 -> PATCH 404 -> rejected', async (t) => {
  const mock = await startMockServer(['404 Not Found\n', '404 Not Found\n']);
  t.after(() => mock.close());
  const { recordView } = clientFor(mock.port);

  const result = await recordView(7, 99);

  assert.deepEqual(result, { ok: false, reason: 'rejected', status: 404 });
  assert.deepEqual(mock.received, ['POST 7 99', 'PATCH 7 99']);
});

// ---------------------------------------------------------------------------
// 4b. Server accepts the connection but never replies -> timeout.
//     (The most common production failure: firewall drop / deadlocked server.)
// ---------------------------------------------------------------------------
test('server that never replies -> timeout', async (t) => {
  // Accept the connection but never write back. Hold each accepted socket so
  // we can destroy it in cleanup — otherwise the open server-side socket keeps
  // the event loop alive and `node --test` never exits.
  const accepted = [];
  const server = net.createServer((s) => accepted.push(s));
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  t.after(async () => {
    for (const s of accepted) s.destroy();
    await new Promise((res) => server.close(res));
  });
  const { port } = server.address();

  const client = createRecommendationClient({ host: '127.0.0.1', port, timeoutMs: 80 });
  const result = await client.recordView(1, 2);

  assert.deepEqual(result, { ok: false, reason: 'timeout' });
});

// ---------------------------------------------------------------------------
// 5. Input validation & protocol-injection guard — no socket opened.
// ---------------------------------------------------------------------------
test('invalid input is rejected before any connection', async (t) => {
  const mock = await startMockServer(['201 Created\n']);
  t.after(() => mock.close());
  const { recordView } = clientFor(mock.port);

  const invalidArgs = [
    [null, 1], [undefined, 1], ['', 1], [1, ''],
    // Whitespace / newline (protocol injection guard).
    [1, 'a b'], [1, '2\n3'], ['1 2', 3],
    // Control char that is not \s, and a non-primitive id (object coercion).
    [1, '2\x013'], [{ toString: () => '5' }, 1],
  ];

  for (const args of invalidArgs) {
    const result = await recordView(...args);
    assert.deepEqual(result, { ok: false, reason: 'invalid-input' }, `args=${JSON.stringify(args)}`);
  }

  // Nothing above should have reached the server.
  assert.equal(mock.connectionCount, 0);
});

// ---------------------------------------------------------------------------
// 6. The integer id `0` is a legitimate Ex2 id — must pass validation.
// ---------------------------------------------------------------------------
test('id 0 is valid (not treated as falsy) and reaches the server', async (t) => {
  const mock = await startMockServer(['201 Created\n']);
  t.after(() => mock.close());
  const { recordView } = clientFor(mock.port);

  const result = await recordView(0, 0);

  assert.deepEqual(result, { ok: true, action: 'created' });
  assert.deepEqual(mock.received, ['POST 0 0']);
});
