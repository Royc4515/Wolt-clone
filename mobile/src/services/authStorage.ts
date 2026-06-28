import AsyncStorage from '@react-native-async-storage/async-storage';

// The key used to store the token in the device's local storage.
const TOKEN_KEY = 'wolt_user_token';

// Function to save the token (called immediately after successful login/registration).
export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving token securely", error);
  }
};

// Function to retrieve the token (called on app startup or before making API requests).
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token", error);
    return null;
  }
};

// Function to remove the token (called when the user clicks 'Logout').
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error removing token", error);
  }
};