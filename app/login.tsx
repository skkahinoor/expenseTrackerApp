import { COLORS, GLASS_STYLES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (isRegister && !name.trim())) {
      Alert.alert("Missing Fields", "Please enter all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (error: any) {
      Alert.alert(
        isRegister ? "Registration Failed" : "Login Failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSpace} />

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, GLASS_STYLES.shadow]}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>EXPENSE TRACKER</Text>
          <Text style={styles.tagline}>Intelligent Financial Management</Text>
        </View>

        {/* Login Form */}
        <View style={styles.cardWrapper}>
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <Text style={styles.title}>
              {isRegister ? "Create Account" : "Welcome Back"}
            </Text>

            {isRegister && (
              <View style={styles.inputGroup}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.textMuted}
                style={styles.icon}
              />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.textMuted}
                style={styles.icon}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Ionicons
                  name={secureText ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? "Create Account" : "Sign In Securely"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setIsRegister(!isRegister)}
            >
              <Text style={styles.toggleText}>
                {isRegister ? "Joined us before? " : "New to the platform? "}
                <Text style={styles.toggleLink}>
                  {isRegister ? "Login" : "Get Started"}
                </Text>
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        <Text style={styles.footer}>Enterprise Security · v2.1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingBottom: 40 },
  topSpace: { height: 100 },
  logoSection: { alignItems: "center", marginBottom: 50 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: "45deg" }],
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginTop: 25,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  cardWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  card: { padding: 30 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 30,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  button: {
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.5 },
  toggleBtn: { marginTop: 24, alignItems: "center" },
  toggleText: { color: COLORS.textSecondary, fontSize: 14 },
  toggleLink: { color: COLORS.primary, fontWeight: "700" },
  footer: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 40,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
