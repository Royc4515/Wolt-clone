import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getToken, saveToken, removeToken } from '../services/authStorage';

// Define the shape of our authentication context.
interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  userToken: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

// The provider component that will wrap our app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if a user is already logged in when the app starts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setUserToken(storedToken); // User is logged in
        }
      } catch (error) {
        console.error("Failed to fetch token on startup", error);
      } finally {
        setIsLoading(false); // Finished checking
      }
    };

    checkLoginStatus();
  }, []);

  // Function to call when user successfully logs in or registers
  const login = async (token: string) => {
    await saveToken(token); // Save to AsyncStorage
    setUserToken(token);    // Update global state
  };

  // Function to call when user clicks logout
  const logout = async () => {
    await removeToken(); // Remove from AsyncStorage
    setUserToken(null);  // Clear global state
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};