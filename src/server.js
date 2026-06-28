const app = require('./app');
const mongoose = require('mongoose');
const { PORT } = require('./config/env');
const { seed } = require('./seed');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the URI from Docker environment, or fallback to localhost
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wolt_db';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seed();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure if the connection fails
  }
};

// Connect to the DB first, then start the server
connectDB().then(() => {
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
});
