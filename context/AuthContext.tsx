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
  profile_pic: string;
  salary: number;
  savingGoal: number;
  fixedExpenses: number;
  notificationsEnabled: boolean;
  salaryBankId: number;
}

export interface FullData {
  banks: any[];
  expenses: any[];
  todos: any[];
  settings: {
    salary: number;
    savingGoal: number;
    fixedExpenses: number;
    notificationsEnabled: boolean;
    salaryBankId: number;
  };
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (
    name: string,
    phoneNumber?: string,
    address?: string,
  ) => Promise<void>;
  fullData: FullData | null;
  refreshFullData: () => Promise<void>;
  updateSettings: (data: any) => Promise<void>;
  resetData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "https://expensetrack.online/backend/public/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fullData, setFullData] = useState<FullData | null>(null);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedUser = await AsyncStorage.getItem("auth_user");
        const storedRole = await AsyncStorage.getItem("auth_role");
        const storedFullData = await AsyncStorage.getItem("auth_fullData");

        if (storedFullData) setFullData(JSON.parse(storedFullData));

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

  const refreshFullData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/user/full-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const json = await res.json();
        const payload: FullData =
          json.data && (json.data.banks || json.data.user) ? json.data : json;

        setFullData(payload);
        AsyncStorage.setItem("auth_fullData", JSON.stringify(payload));

        if (payload.user) {
          setUser(payload.user);
          await AsyncStorage.setItem("auth_user", JSON.stringify(payload.user));
        }
      }
    } catch (e) {
      console.error("Failed to fetch full data", e);
    }
  };

  useEffect(() => {
    if (token) {
      refreshFullData();
    }
  }, [token]);

  const refreshUser = refreshFullData;

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

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    // Successfully registered, now log in automatically
    await login(email, password);
  };

  const updateProfile = async (
    name: string,
    phoneNumber?: string,
    address?: string,
  ) => {
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_BASE}/user/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, phone_number: phoneNumber, address }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to update profile");
    }
    await refreshUser();
  };

  const updateSettings = async (data: any) => {
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_BASE}/user/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to update settings");
    }
    await refreshFullData();
  };

  const resetData = async () => {
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_BASE}/user/reset-data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to reset data");
    }
  };

  const deleteAccount = async () => {
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_BASE}/user`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to delete account");
    }
    await logout();
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } catch (e) {
        console.error("Logout API failed", e);
      }
    }
    await AsyncStorage.multiRemove(["auth_token", "auth_user", "auth_role"]);
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        fullData,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateSettings,
        resetData,
        deleteAccount,
        refreshUser,
        refreshFullData,
      }}
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
