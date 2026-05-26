const express = require('express');

const apiRouter = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);
app.use('/api', notFound);

app.use(errorHandler);

module.exports = app;
