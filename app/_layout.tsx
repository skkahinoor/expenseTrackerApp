import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BankProvider } from "@/context/BankContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { TodoProvider } from "@/context/TodoContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (!token && inAuthGroup) {
      // Not logged in but trying to access protected tabs → go to login
      router.replace("/login");
    } else if (token && !inAuthGroup) {
      // Logged in but on login/index → go to tabs
      router.replace("/(tabs)");
    }
  }, [token, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BankProvider>
          <ExpenseProvider>
            <TodoProvider>
              <RootLayoutNav />
            </TodoProvider>
          </ExpenseProvider>
        </BankProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
