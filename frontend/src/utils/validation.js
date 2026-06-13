/**
 * Validates an email address using Regex.
 * Returns an error string if invalid, or null if valid.
 */
export const validateEmail = (email) => {
    if (!email || email.trim() === "") return "Email is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email format";

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
 * Checks for email, password strength, password match, name, and profile picture.
 * Returns an object containing the visual error states for the UI.
 */
export const validateRegistration = (userData) => {
    const errors = {};

    // Email validation.
    const emailErr = validateEmail(userData.email);
    if (emailErr) errors.email = emailErr;

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

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};