const express = require('express');

const apiRouter = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);
app.use('/api', notFound);

// Global middleware to catch and format JSON syntax errors (e.g., from express.json()).
// Ensures invalid payloads return a clean 400 Bad Request with a specific JSON structure,
// preventing the server from returning a default HTML error page or a 500 status.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "Bad Request: Invalid JSON payload format" });
    }
    next(err);
});

app.use(errorHandler);

module.exports = app;
