const http = require('node:http');

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const headers = {};
    let payload;
    if (body !== undefined) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      { host: '127.0.0.1', port, method, path, headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const isJson = (res.headers['content-type'] || '').includes('application/json');
          let parsed = raw;
          if (isJson && raw.length > 0) {
            try { parsed = JSON.parse(raw); } catch { /* leave raw */ }
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

async function withServer(app, fn) {
  const server = app.listen(0);
  try {
    await new Promise((r) => server.once('listening', r));
    await fn(server);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

module.exports = { request, withServer };
