'use strict';

// SCRUM-206 / 207 / 208 — Legacy TCP Recommendation Bridge.
//
// Wraps the raw `node:net` socket conversation with the legacy Ex2 C++
// Recommendation Server into a clean async service. Controllers call
// `recordView(userId, productId)` and await a plain result object; they never
// deal with sockets, buffering, or the POST -> PATCH fallback protocol.
//
// Design (see docs/specs/tcp-bridge.md):
//   * Built strictly on `node:net` — no third-party libraries.
//   * NEVER rejects and NEVER throws: every outcome (success, refusal,
//     unreachable server, timeout, bad input) resolves to a result object,
//     so an unreachable/slow Ex2 server can never crash the Node process.
//   * Format-agnostic: ids are sent verbatim; mapping the web app's UUIDs to
//     Ex2's integer ids is a downstream (controller-wiring) concern.

const net = require('node:net');
const env = require('../config/env');

const DEFAULT_TIMEOUT_MS = 2000;

// Ex2 replies are tiny ("201 Created\n", ~20 bytes). Cap the read buffer so a
// misbehaving/hostile server that streams data without a terminating '\n'
// cannot exhaust the heap before the timeout fires.
const MAX_REPLY_BYTES = 1024;

// Exact status codes from the Ex2 protocol (src/Commands/*.cpp).
const STATUS_CREATED = 201; // POST: new user created.
const STATUS_NO_CONTENT = 204; // PATCH: existing user updated.
const STATUS_OK = 200;         // GET: successful retrieval.

/**
 * Validates a single id per spec §6.1.
 * Valid := non-null, non-undefined, non-empty once stringified, and free of
 * any whitespace (spaces/tabs/newlines would corrupt the line-based protocol
 * or inject extra commands). Note `0` is a legitimate id and must pass.
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidId(value) {
  // Only primitives are meaningful ids; reject objects/arrays/etc. so a custom
  // `.toString()` can't smuggle a value past the character check.
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const str = String(value);
  // Allowlist printable ASCII (0x21–0x7E): no whitespace and no control
  // characters, which would corrupt the line-based protocol or inject a second
  // command. Integer ids, UUIDs, and `0` all satisfy this.
  return /^[\x21-\x7E]+$/.test(str);
}

/**
 * Parses the leading integer status token of an Ex2 reply line.
 * e.g. "201 Created" -> 201, "404 Not Found" -> 404.
 * @param {string} line
 * @returns {number} the status, or NaN if unparseable.
 */
function parseStatus(line) {
  return Number.parseInt(line.trim().split(/\s+/)[0], 10);
}

/**
 * Creates a recommendation-bridge client bound to a specific Ex2 server.
 * Connection settings are injected so the client is trivially testable
 * against a mock server (loose coupling / dependency inversion).
 *
 * @param {{ host: string, port: number, timeoutMs?: number }} options
 * @returns {{ recordView: (userId: unknown, productId: unknown) => Promise<object> }}
 */
function createRecommendationClient({ host, port, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  /**
   * Records that `userId` viewed `productId` in the Ex2 server, applying the
   * POST -> PATCH fallback. Always resolves; never rejects.
   *
   * @param {unknown} userId
   * @param {unknown} productId
   * @returns {Promise<object>} a result object per spec §6.
   */
  function recordView(userId, productId) {
    if (!isValidId(userId) || !isValidId(productId)) {
      return Promise.resolve({ ok: false, reason: 'invalid-input' });
    }

    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      let settled = false;
      let buffer = '';
      let patchSent = false;

      // Resolve exactly once and tear the socket down.
      const settle = (result) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };

      const send = (verb) => socket.write(`${verb} ${userId} ${productId}\n`);

      socket.setTimeout(timeoutMs);

      socket.once('connect', () => {
        send('POST');
      });

      socket.on('data', (chunk) => {
        if (settled) return; // Socket is being torn down; ignore late data.

        buffer += chunk.toString();
        if (buffer.length > MAX_REPLY_BYTES) {
          // Server is flooding without a line terminator — treat as unusable.
          settle({ ok: false, reason: 'unreachable' });
          return;
        }

        const nl = buffer.indexOf('\n');
        if (nl === -1) return; // Wait for a complete, '\n'-terminated reply.

        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1); // Reset for any subsequent (PATCH) reply.
        const status = parseStatus(line);

        if (!patchSent) {
          // --- POST reply ---
          if (status === STATUS_CREATED) {
            settle({ ok: true, action: 'created' });
            return;
          }
          // User already exists (404) or bad request (400): fall back to PATCH
          // on the SAME connection to append the view to the existing user.
          patchSent = true;
          send('PATCH');
          return;
        }

        // --- PATCH reply ---
        if (status === STATUS_NO_CONTENT) {
          settle({ ok: true, action: 'updated' });
        } else {
          // Guard against an unparseable status (NaN) so the result stays
          // JSON-clean (JSON.stringify(NaN) === 'null').
          settle({ ok: false, reason: 'rejected', status: Number.isFinite(status) ? status : null });
        }
      });

      socket.on('timeout', () => settle({ ok: false, reason: 'timeout' }));

      // Connection refused / DNS failure / reset, etc. — never crash.
      socket.on('error', () => settle({ ok: false, reason: 'unreachable' }));

      // 'close' fires after every socket.destroy(), including our own teardown
      // on success — but `settled` is already true by then, so this only
      // resolves 'unreachable' when the server closed before a full reply.
      socket.on('close', () => settle({ ok: false, reason: 'unreachable' }));
    });
  }

  /**
   * Fetches recommendations from the legacy Ex2 C++ Server using the GET protocol.
   * @param {string|number} userId 
   * @param {string|number} productId 
   * @returns {Promise<number[]>} Array of recommended product IDs.
   */
  function getRecommendations(userId, productId) {
    if (!isValidId(userId) || !isValidId(productId)) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      let settled = false;
      let buffer = '';

      const settle = (result) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(timeoutMs);

      socket.once('connect', () => {
        // Send the GET command to trigger the Recommender logic in C++.
        socket.write(`GET ${userId} ${productId}\n`);
      });

      socket.on('data', (chunk) => {
        if (settled) return;

        buffer += chunk.toString();
        
        // Prevent buffer overflow.
        if (buffer.length > MAX_REPLY_BYTES) {
          settle([]); 
          return;
        }

        // The Ex2 server returns "200 Ok\n\n1 4 5\n". We look for the double newline divider.
        const splitIndex = buffer.indexOf('\n\n');
        if (splitIndex === -1) return; 

        const resultPart = buffer.slice(splitIndex + 2);
        
        // Ensure the results segment is fully received.
        if (resultPart.indexOf('\n') === -1) return; 

        const statusLine = buffer.slice(0, splitIndex);
        const status = parseStatus(statusLine);

        if (status === STATUS_OK) {
          // Parse the space-separated string into an array of integers.
          const recommendedIds = resultPart.trim().split(' ').map(Number).filter(id => !isNaN(id));
          settle(recommendedIds);
        } else {
          // Fallback to empty array if user/product not found (e.g., 404).
          settle([]);
        }
      });

      // Always resolve with an empty array on failures to prevent server crashes.
      socket.on('timeout', () => settle([]));
      socket.on('error', () => settle([]));
      socket.on('close', () => settle([]));
    });
  }

  return { recordView, getRecommendations };
}

// Default client bound to the configured Ex2 server, for production use by
// controllers. Tests use `createRecommendationClient` with a mock port.
const defaultClient = createRecommendationClient({
  host: env.EX2_HOST,
  port: env.EX2_PORT,
});

module.exports = {
  createRecommendationClient,
  recordView: defaultClient.recordView,
  getRecommendations: defaultClient.getRecommendations,
};
