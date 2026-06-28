import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'wolt_user_token';
const GUEST_LOCATION_KEY = 'guest_location';

// --- TOKEN MANAGEMENT ---
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

// --- GUEST LOCATION MANAGEMENT ---
// Function to save guest's location.
export const saveGuestLocation = async (lat: number, lng: number) => {
  const location = JSON.stringify({ lat, lng });
  await AsyncStorage.setItem(GUEST_LOCATION_KEY, location);
};

// Function to get guest's location.
export const getGuestLocation = async () => {
  const data = await AsyncStorage.getItem(GUEST_LOCATION_KEY);
  return data ? JSON.parse(data) : null;
};

// Function to remove guest's location.
export const removeGuestLocation = async () => {
  await AsyncStorage.removeItem(GUEST_LOCATION_KEY);
};