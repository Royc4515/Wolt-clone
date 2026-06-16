// Base URL of the Node.js server.
const BASE_URL = 'http://localhost:3000';

// Exporting the wrapper function. It accepts a route endpoint and optional fetch settings.
export const apiFetch = async (endpoint, options = {}) => {
    // Retrieve the saved JWT from the browser's local storage.
    const token = localStorage.getItem('jwt_token');

    // Set default headers, allowing overrides from the 'options' parameter.
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // If a token exists, attach it to the Authorization header.
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        // Execute the actual HTTP request using the original fetch API.
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Global check: If the server rejects the token (401), force a logout.
        if (response.status === 401) {
            localStorage.removeItem('jwt_token');
            window.location.href = '/login';        // Redirect to login page.
            throw new Error('Unauthorized');
        }

        // Parse the response body as JSON.
        const data = await response.json();

        // If the response status is not as expected, throw the server's error message.
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        // Return the parsed data upon success.
        return data;
    } catch (error) {
        // Log network or unexpected errors.
        console.error('API call failed: ', error);
        throw error;
    }
};