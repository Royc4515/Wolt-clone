'use strict';

function notImplemented(_req, res) {
  res.status(501).json({ error: 'Not implemented' });
}

module.exports = { notImplemented };
