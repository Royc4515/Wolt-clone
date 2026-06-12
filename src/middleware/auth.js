'use strict';

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to protect routes that require authntication.
const requireAuth = (req, res, next) => {
    // Extracting the token from Headers.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Token is missing" });
    }

    try {
        // Verifying the token is matching.
        const verified = jwt.verify(token, JWT_SECRET);

        req.userId = verified.id;
        req.user = verified;

        next()
    } catch (err) {
        res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

module.exports = {
    requireAuth
};