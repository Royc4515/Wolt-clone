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

    // Mock verification. We simulate checking if the credentials match a known user.
    if (email !== "test@example.com" || password !== "mySecretPassword") {
        return res.status(401).json({ error: "Incorrect email or password" });
    }

    // Return 200 OK with the mock user ID. Will be modified after implementing DB.
    const mockUserId = "user-12345";
    res.status(200).json({ id: mockUserId });
};

const getUser = (req, res) => {
    // Extract the user ID.
    const { id } = req.params;

    // 2. Mock DB check - verify if the requested ID exists (We only "know" about user-12345 right now).
    if (id !== "user-12345") {
        return res.status(404).json({ error: "User not found" });
    }

    // Create a mock user object to return.
    const mockUser = {
        id: "user-12345",
        name: "Israel Israeli",
        phone: "050-1234567",
        address: "Tel Aviv",
        email: "test@example.com"
    };

    // Return the user details with 200 OK.
    res.status(200).json(mockUser);
};

// Export the function so the router can use it.
module.exports = {
    createUser,
    loginUser,
    getUser
};