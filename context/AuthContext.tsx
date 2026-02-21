import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserRole {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role_id: string;
  salary: string;
  saving_goal: string;
  notifications_enabled: string;
  salary_bank_id: string;
  last_notification_date: string;
  phone_number: string;
  address: string;
  profile_pic: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedUser = await AsyncStorage.getItem("auth_user");
        const storedRole = await AsyncStorage.getItem("auth_role");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setRole(storedRole);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed. Please try again.");
    }

    // Persist to storage
    await AsyncStorage.setItem("auth_token", data.token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(data.user));
    await AsyncStorage.setItem("auth_role", data.role);

    setToken(data.token);
    setUser(data.user);
    setRole(data.role);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["auth_token", "auth_user", "auth_role"]);
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, role, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
