import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#020617", // Deep navy/black
  surface: "#0f172a", // Dark navy
  surfaceLighter: "#1e293b",
  primary: "#3b82f6", // Blue
  accent: "#f59e0b", // Amber/Orange for FAB and Primary Buttons
  success: "#10b981", // Emerald
  danger: "#ef4444", // Rose
  warning: "#f59e0b", // Amber
  text: "#f8fafc", // Off-white
  textSecondary: "#94a3b8", // Muted light blue/grey
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

export const GLASS_STYLES = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});
