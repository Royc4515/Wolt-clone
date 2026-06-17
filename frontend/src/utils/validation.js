/**
 * Validates a username.
 * Returns an error string if invalid, or null if valid.
 */
export const validateUsername = (username) => {
    if (!username || username.trim() === "") return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters long";

    return null;
};

/**
 * Validates a password based on the following rules:
 * - Minimum 8 characters
 * - Contains at least one letter and one number
 */
export const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters long";

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
        return "Password must contain both letters and numbers";
    }

    return null;
};

/**
 * Validates the entire registration form before making an API call.
 * Checks for username, password strength, password match, name, and profile picture.
 * Returns an object containing the visual error states for the UI.
 */
export const validateRegistration = (userData) => {
    const errors = {};

    // Username validation.
    const usernameErr = validateUsername(userData.username);
    if (usernameErr) errors.username = usernameErr;

    // Password rules validaiton.
    const passwordErr = validatePassword(userData.password);
    if (passwordErr) errors.password = passwordErr;

    // Password confirmation (second field of password).
    if (userData.password !== userData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    // Name validation.
    if (!userData.displayName || userData.displayName.trim() === "") {
        errors.displayName = "Display name is required";
    }

    // Profile picture validation.
    if (!userData.profilePicture || userData.profilePicture.trim() === "") {
        errors.profilePicture = "Profile picture is required";
    }

    // Location validation.
    const lat = parseFloat(userData.lat);
    const lng = parseFloat(userData.lng);
    if (userData.lat === '' || userData.lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
        errors.lat = "Latitude must be a number between -90 and 90";
    }
    if (userData.lng === '' || userData.lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
        errors.lng = "Longitude must be a number between -180 and 180";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};