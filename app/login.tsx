import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
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
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation is handled automatically by _layout.tsx
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet" size={36} color="#6366f1" />
          </View>
          <Text style={styles.appName}>ExpenseTracker</Text>
          <Text style={styles.tagline}>Take control of your finances</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputContainer,
                emailFocused && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? "#6366f1" : "#64748b"}
              />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                passwordFocused && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passwordFocused ? "#6366f1" : "#64748b"}
              />
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Sign In</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register */}
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2026 ExpenseTracker · All rights reserved
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f1f5f9",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 28,
  },
  fieldWrapper: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#334155",
    height: 52,
  },
  inputFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#0f172a",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#f1f5f9",
    fontSize: 15,
  },
  forgotWrapper: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -6,
  },
  forgotText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },
  dividerText: {
    color: "#475569",
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: "600",
  },
  registerButton: {
    alignItems: "center",
  },
  registerText: {
    color: "#64748b",
    fontSize: 14,
  },
  registerLink: {
    color: "#6366f1",
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#334155",
    fontSize: 11,
    marginTop: 28,
  },
});
