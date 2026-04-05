import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof DARK_COLORS;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const LIGHT_COLORS = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceLighter: "#f1f5f9",
  primary: "#3b82f6",
  accent: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#64748b",
  border: "rgba(0, 0, 0, 0.08)",
  cardGradient: ["#ffffff", "#f8fafc"],
  categories: {
    rent: "#ef4444",
    food: "#3b82f6",
    shopping: "#f59e0b",
    transport: "#14b8a6",
    others: "#a855f7",
  },
};

export const DARK_COLORS = {
  background: "#020617",
  surface: "#0f172a",
  surfaceLighter: "#1e293b",
  primary: "#3b82f6",
  accent: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "rgba(255, 255, 255, 0.08)",
  cardGradient: ["#0f172a", "#020617"],
  categories: {
    rent: "#ef4444",
    food: "#3b82f6",
    shopping: "#f59e0b",
    transport: "#14b8a6",
    others: "#a855f7",
  },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = useColorScheme() || 'dark';
  const [theme, setTheme] = useState<Theme>(systemTheme);

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('user_theme');
      if (storedTheme) {
        setTheme(storedTheme as Theme);
        Appearance.setColorScheme(storedTheme as Theme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    Appearance.setColorScheme(newTheme);
    await AsyncStorage.setItem('user_theme', newTheme);
  };

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
