import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const MENU_ITEMS = [
  { icon: "person-outline", label: "Edit Profile", color: "#6366f1" },
  { icon: "notifications-outline", label: "Notifications", color: "#f59e0b" },
  { icon: "shield-checkmark-outline", label: "Security", color: "#10b981" },
  { icon: "card-outline", label: "Payment Methods", color: "#ec4899" },
  { icon: "help-circle-outline", label: "Help & Support", color: "#64748b" },
  { icon: "document-text-outline", label: "Privacy Policy", color: "#64748b" },
];

export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const salary = parseFloat(user?.salary || "0");
  const savingGoal = parseFloat(user?.saving_goal || "0");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar + Info */}
        <View style={styles.profileCard}>
          {user?.profile_pic ? (
            <Image source={{ uri: user.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#6366f1" />
            </View>
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role?.name?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color="#6366f1" />
            <Text style={styles.statValue}>
              ₹{salary.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.statLabel}>Monthly Salary</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            <Text style={styles.statValue}>
              ₹{savingGoal.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.statLabel}>Saving Goal</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={user?.phone_number || "—"}
          />
          <InfoRow
            icon="location-outline"
            label="Address"
            value={user?.address || "—"}
          />
          <InfoRow
            icon="calendar-outline"
            label="Member Since"
            value={user?.created_at?.slice(0, 10) || "—"}
          />
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: item.color + "22" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={item.color}
                />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon as any}
        size={16}
        color="#6366f1"
        style={{ marginRight: 10 }}
      />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scroll: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: "#6366f1",
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: "#6366f122",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6366f144",
  },
  roleText: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#f1f5f9",
    fontWeight: "600",
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f871711a",
    borderRadius: 14,
    padding: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: "#f8717133",
  },
  logoutText: {
    color: "#f87171",
    fontSize: 15,
    fontWeight: "700",
  },
});
