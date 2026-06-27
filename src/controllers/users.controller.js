const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in for password hashing
const User = require('../models/User'); // Import the Mongoose model

// Load secret key used to sign the JWT.
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to hash passwords using SHA-256.
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const createUser = async (req, res) => {
    try {
        // Extract user details from the incoming JSON request.
        const { username, password, displayName, profilePicture, location, role } = req.body;
        
        // Array to collect missing fields.
        const missingFields = [];
        
        // Check each field and add to the array if it's missing.
        if (!username) missingFields.push("Username");
        if (!password) missingFields.push("Password");
        if (!displayName) missingFields.push("Display Name");
        if (!profilePicture) missingFields.push("Profile Picture");
        if (!location || typeof location.lat !== 'number' ||  typeof location.lng !== 'number') {
            missingFields.push("Location (with valid lat and lng)");
        }

        // If there are missing fields, return a 400 Bad Request with a detailed message.
        if (missingFields.length > 0) {
            const errMsg = `${missingFields.join(', ')} is required`;
            return res.status(400).json({ error: errMsg });
        }

        // Check if the user already exists in MongoDB.
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Assign role (default to 'customer').
        const userRole = (role === 'admin') ? 'admin' : 'customer';

        // Hash the password
        const hashedPassword = hashPassword(password);

        // Generate a new user using the input data.
        const newUser = await User.create({ 
                        username,
                        password: hashedPassword, 
                        displayName, 
                        profilePicture,
                        location,
                        role: userRole
        });

        // Return 201 Created on success with the new user's ID.
        res.status(201).json({ id: newUser.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    
};

const loginUser = async (req, res) => {
    try {
        // Extract only username and password for login.
        const { username, password } = req.body;

        // Validate missing fields.
        const missingFields = [];
        if (!username) missingFields.push("Username");
        if (!password) missingFields.push("Password");

        if (missingFields.length > 0) {
            const errMsg = `${missingFields.join(', ')} is required`;
            return res.status(400).json({ error: errMsg });
        }

        // Search for the user in DB.
        const user = await User.findOne({ username });

        // If username isn't in DB return error.
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Else, check if the entered password matches the one in DB. If not, return error.
        if (user.password !== hashPassword(password)) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Create a token for the user.
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                displayName: user.displayName,
                role: user.role,
                location: user.location
            },
            JWT_SECRET
        );

        // Return 200 OK with the user's token.
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
};

const getUser = async (req, res) => {
    try {
        // Extract the user ID.
        const { id } = req.params;

        // Search for the user in DB.
        const user = await User.findById(id);

        // If user wasn't found return error.
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return the user details (without the password) with 200 OK.
        const { password, ...userWithoutPassword } = user.toObject();
        res.status(200).json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
};

// Function to update user details.
const updateUser = async (req, res) => {
    try {
        // Extract the user ID from the route parameter.
        const { id } = req.params;
    
        // Ensure the user is only updating their own profile.
        if (req.user && req.user.id !== id) {
            return res.status(403).json({ error: "Forbidden: You can only update your own profile" });
        }

        // Extract only the fields that are allowed to be updated.
        const { displayName, profilePicture, password, location, role } = req.body;
        const updateData = {};

        if (displayName) updateData.displayName = displayName;
        if (profilePicture) updateData.profilePicture = profilePicture;
        if (password) updateData.password = hashPassword(password); 
        if (role) updateData.role = role;
        if (location) updateData.location = location;

        // Find and update.
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Create a new token with the updated data.
        const newToken = jwt.sign(
            { 
                id: updatedUser.id, 
                username: updatedUser.username, 
                displayName: updatedUser.displayName,
                role: updatedUser.role,           
                location: updatedUser.location    
            },
            JWT_SECRET         
        );

        // Return the updated user (excluding password).
        const { password: currentPassword, ...userWithoutPassword } = updatedUser.toObject();
        res.status(200).json({
            user: userWithoutPassword, 
            token: newToken 
        });
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
    
};

// Export the function so the router can use it.
module.exports = {
    createUser,
    loginUser,
    getUser,
    updateUser
};