import { apiFetch } from "./api";

/**
 * Login function
 * Submits username and password. On successful authentication, saves the JWT to local storage.
 */
export const login = async (username, password) => {
    // Sent a POST request to generate a JWT.
    const data = await apiFetch('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    // The server should return an object containing the token. Save it locally.
    if (data && data.token) {
        localStorage.setItem('jwt_token', data.token);
    }

    return data;
};

/**
 * Register function
 * Accepts user data (including the Base64 profile picture) and sends it to the server to create a new user.
 */
export const register = async (userData) => {
  // Send a POST request to create a new user
  const data = await apiFetch('/api/users', {
    method: 'POST',
    // userData already matches the agreed API contract.
    body: JSON.stringify(userData), 
  });

  return data;
};

/**
 * Logout function
 * Removes the JWT from local storage so the user is no longer authenticated in future requests.
 */
export const logout = () => {
    localStorage.removeItem('jwt_token');
    // Clear per-restaurant shopping carts so they don't leak to the next user
    // who logs in on the same browser.
    Object.keys(localStorage)
        .filter((k) => k.startsWith('cart_'))
        .forEach((k) => localStorage.removeItem(k));
};

/**
 * Update Profile function
 * Accepts an explicitly authenticated user ID and the fields to update.
 * Replaces the old JWT token with the newly generated one.
 */
export const updateUserProfile = async (id, updateData) => {
    const data = await apiFetch(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
    });

    if (data && data.token) {
        localStorage.setItem('jwt_token', data.token);
    }

    return data;
};