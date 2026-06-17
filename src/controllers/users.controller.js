const jwt = require('jsonwebtoken');
const usersRepo = require('../services/repositories/users.repository');

// Load secret key used to sign the JWT.
const JWT_SECRET = process.env.JWT_SECRET;

const createUser = (req, res) => {
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

    // Check if the user already exists in data.
    const existing = usersRepo.findBy(user => user.username === username);
    if (existing.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
    }

    // Assign role (default to 'customer').
    const userRole = (role === 'admin') ? 'admin' : 'customer';

    // Generate a new user using the input data.
    const newUser = usersRepo.create({ 
                    username,
                    password, 
                    displayName, 
                    profilePicture,
                    location,
                    role: userRole
                });

    // Return 201 Created on success with the new user's ID.
    res.status(201).json({ id: newUser.id });
};

const loginUser = (req, res) => {
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
    const findUser = usersRepo.findBy(user => user.username === username);

    // If username isn't in DB return error.
    if (findUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    // Else, check if the entered password matches the one in DB. If not, return error.
    const user = findUser[0];
    if (user.password !== password) {
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
};

const getUser = (req, res) => {
    // Extract the user ID.
    const { id } = req.params;

    // Search for the user in DB.
    const user = usersRepo.findById(id);

    // If user wasn't found return error.
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    // Return the user details (without the password) with 200 OK.
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
};

// Function to update user details.
const updateUser = (req, res) => {
    // Extract the user ID from the route parameter.
    const { id } = req.params;
    
    // Ensure the user is only updating their own profile.
    if (req.user && req.user.id !== id) {
        return res.status(403).json({ error: "Forbidden: You can only update your own profile" });
    }

    // Find the user first to make sure they exist in DB.
    const user = usersRepo.findById(id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    // Extract only the fields that are allowed to be updated.
    const { displayName, profilePicture, password, location } = req.body;
    
    const updateData = {};

    if (displayName) updateData.displayName = displayName;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (password) updateData.password = password; 
    
    // Validation for location if it's being updated.
    if (location) {
        if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
             return res.status(400).json({ error: "Location must include valid lat and lng numbers" });
        }
        updateData.location = location;
    }

    const updatedUser = usersRepo.update(id, updateData);

    if (!updatedUser) {
         return res.status(500).json({ error: "Failed to update user" });
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
    const { password: currentPassword, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword, newToken);
};

// Export the function so the router can use it.
module.exports = {
    createUser,
    loginUser,
    getUser,
    updateUser
};