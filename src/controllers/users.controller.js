const usersRepo = require('../services/repositories/users.repository');

const createUser = (req, res) => {
    // Extract user details from the incoming JSON request.
    const { name, phone, address, email, password } = req.body;

    // Array to collect missing fields.
    const missingFields = [];

    // Check each field and add to the array if it's missing.
    if (!name) missingFields.push("Name");
    if (!phone) missingFields.push("Phone");
    if (!address) missingFields.push("Address");
    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");

    // If there are missing fields, return a 400 Bad Request with a detailed message.
    if (missingFields.length > 0) {
        const errMsg = `${missingFields.join(', ')} is required`;
        return res.status(400).json({ error: errMsg });
    }

    // Generate a new user using the input data.
    const newUser = usersRepo.create({ name, phone, address, email, password });

    // Return 201 Created on success with the new user's ID.
    res.status(201).json({ id: newUser.id });
};

const loginUser = (req, res) => {
    // Extract only email and password for login.
    const { email, password } = req.body;

    // Validate missing fields.
    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
        const errMsg = `${missingFields.join(', ')} is required`;
        return res.status(400).json({ error: errMsg });
    }

    // Search for the user in DB.
    const findUser = usersRepo.findBy(user => user.email === email);

    // If email isn't in DB return error.
    if (findUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    // Else, check if the entered password matches the one in DB. If not, return error.
    const user = findUser[0];
    if (user.password !== password) {
        return res.status(401).json({ error: "Incorrect password" });
    }

    // Return 200 OK with the user ID.
    res.status(200).json({ id: user.id });
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

// Export the function so the router can use it.
module.exports = {
    createUser,
    loginUser,
    getUser
};