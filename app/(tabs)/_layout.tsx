import { COLORS as THEME_COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Tabs, useRouter } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: COLORS, isDark } = useTheme();
  const TAB_BAR_HEIGHT =
    (Platform.OS === "ios" ? 88 : 70) + Math.max(insets.bottom, 0);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: TAB_BAR_HEIGHT,
            paddingBottom:
              Platform.OS === "ios" ? 30 : Math.max(insets.bottom + 10, 15),
            paddingTop: 8,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 20,
            overflow: "visible", // Fix for Android FAB clipping
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "800",
            marginTop: Platform.OS === "ios" ? 0 : 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="banks"
          options={{
            title: "Banks",
            tabBarIcon: ({ color }) => (
              <Ionicons name="business" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color }) => (
              <Ionicons name="checkbox" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarLabel: () => null,
            tabBarIcon: () => (
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: COLORS.accent,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: -15, // Lifted slightly
                  shadowColor: COLORS.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  borderWidth: 3,
                  borderColor: COLORS.background,
                }}
              >
                <Ionicons name="add" size={26} color="#fff" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Stats",
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-sharp" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "User",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={20} color={color} />
            ),
          }}
        />
        {/* Hidden internal routes */}
        <Tabs.Screen
          name="expenses"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
