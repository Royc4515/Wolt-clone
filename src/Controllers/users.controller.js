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

    // Generate a mock ID (will be replaced by actual DB logic later).
    const mockUserId = "user-12345";

    // Return 201 Created on success with the new user's ID.
    res.status(201).json({ id: mockUserId });
};

// Export the function so the router can use it.
module.exports = {
    createUser
};