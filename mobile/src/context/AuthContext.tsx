import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { getToken, saveToken, removeToken } from '../services/authStorage';
import type { AuthUser } from '../services/api';

// Define the shape of our authentication context combining both approaches
interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

// The provider component that will wrap our app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if a user is already logged in when the app starts (Dana's logic)
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
          // Note: In a full app, you might also want to fetch or decode the user object here
        }
      } catch (error) {
        console.error("Failed to fetch token on startup", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Function to call when user successfully logs in or registers (Merged logic)
  const login = async (newToken: string, newUser: AuthUser) => {
    await saveToken(newToken); // Dana's AsyncStorage
    setToken(newToken);
    setUser(newUser);          // Roy's User state
  };

  // Function to call when user clicks logout
  const logout = async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Roy's custom hook for easier consumption in components
export const useAuth = () => useContext(AuthContext);