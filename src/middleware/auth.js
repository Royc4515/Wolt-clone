'use strict';

// Middleware to protect routes that require authntication.
const requireAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: x-user-id header is missing" });
    }

    req.userId = userId;
    next();
};

module.exports = {
    requireAuth
};