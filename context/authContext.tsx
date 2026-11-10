import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ── Shape of the context value ─────────────────────────────────────────────
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (result:any) => Promise<void>;
  logout: () => Promise<void>;
  userData: any;
  updateUserData: (updated: any) => Promise<void>;
}

// ── Create context with a safe default ────────────────────────────────────
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  userData: null,
  updateUserData: async () => {},
});

// ── Provider — wrap your app root with this ───────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>({
    name: "",
    email: "",
  })

  // Check token on app start
  useEffect(() => {

    AsyncStorage.getItem("userData")
      .then((data) => setUserData(JSON.parse(data || '')))

    AsyncStorage.getItem("userToken")
      .then((token) => setIsAuthenticated(!!token))
      .finally(() => setIsLoading(false));
  }, []);

  // Call after a successful login API response
  async function login(result:any) {
    await AsyncStorage.setItem("userToken", result?.token);
    await AsyncStorage.setItem("userData", JSON.stringify(result?.userData));
    setIsAuthenticated(true);
  }

  // Call on logout
  async function logout() {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    setIsAuthenticated(false);
  }

  // Call on profile / user data update
  async function updateUserData(updated: any) {
    setUserData((prev: any) => {
      const merged = { ...prev, ...updated };
      AsyncStorage.setItem("userData", JSON.stringify(merged)).catch((err) =>
        console.error("Failed to save updated userData to storage", err)
      );
      return merged;
    });
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, userData, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook for easy consumption ──────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
