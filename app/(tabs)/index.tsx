import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline",
    label: "Add Expense",
    color: "#6366f1",
    route: "/add",
  },
  {
    icon: "receipt-outline",
    label: "Expenses",
    color: "#10b981",
    route: "/expenses",
  },
  {
    icon: "bar-chart-outline",
    label: "Reports",
    color: "#ec4899",
    route: "/reports",
  },
  {
    icon: "person-outline",
    label: "Profile",
    color: "#f59e0b",
    route: "/profile",
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { expenses, isLoading, totalSpent, refresh } = useExpenses();
  const router = useRouter();

  const salary = parseFloat(user?.salary || "0");
  const savingGoal = parseFloat(user?.saving_goal || "0");
  const remaining = salary - totalSpent;
  const savingProgress = Math.min((totalSpent / salary) * 100, 100);

  const firstName = user?.name?.split(" ")[0] || "User";

  const recentTransactions = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food & Dining":
        return "#f59e0b";
      case "Transportation":
        return "#6366f1";
      case "Shopping":
        return "#ec4899";
      case "Bills & Utilities":
        return "#ef4444";
      default:
        return "#10b981";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Food & Dining":
        return "fast-food-outline";
      case "Transportation":
        return "car-outline";
      case "Shopping":
        return "cart-outline";
      case "Bills & Utilities":
        return "receipt-outline";
      default:
        return "list-outline";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            <Text style={styles.balanceLabel}>Monthly Salary</Text>
            <Text style={styles.balanceAmount}>
              ₹{salary.toLocaleString("en-IN")}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <Ionicons name="wallet-outline" size={16} color="#10b981" />
                <Text style={styles.balanceStatLabel}>Remaining</Text>
                <Text style={[styles.balanceStatValue, { color: "#10b981" }]}>
                  ₹{remaining.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStat}>
                <Ionicons
                  name="trending-down-outline"
                  size={16}
                  color="#f87171"
                />
                <Text style={styles.balanceStatLabel}>Spent</Text>
                <Text style={[styles.balanceStatValue, { color: "#f87171" }]}>
                  ₹{totalSpent.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Saving Goal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Usage</Text>
            <Text style={styles.sectionMeta}>
              Salary: ₹{salary.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[styles.progressFill, { width: `${savingProgress}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {savingProgress.toFixed(1)}% of salary spent
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                activeOpacity={0.75}
                onPress={() => router.push(action.route as any)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: action.color + "22" },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={22}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/expenses")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionList}>
            {isLoading && expenses.length === 0 ? (
              <ActivityIndicator color="#6366f1" style={{ padding: 20 }} />
            ) : recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: getCategoryColor(tx.category) + "22" },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(tx.category) as any}
                      size={20}
                      color={getCategoryColor(tx.category)}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txLabel}>
                      {tx.description || tx.category}
                    </Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={styles.txAmount}>
                    -₹{tx.amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent transactions</Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f1f5f9",
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  balanceCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: "#6366f1",
  },
  balanceCardInner: {
    padding: 22,
  },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 14,
  },
  balanceStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  balanceDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  balanceStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    marginTop: 2,
  },
  balanceStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  sectionMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  seeAll: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#1e293b",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "center",
  },
  transactionList: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  txDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f87171",
  },
  emptyText: {
    color: "#64748b",
    padding: 20,
    textAlign: "center",
  },
});
