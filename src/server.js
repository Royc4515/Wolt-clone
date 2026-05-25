const app = require('./app');
const { PORT } = require('./config/env');

const server = app.listen(PORT, () => {
  console.log(`Web server listening on :${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
