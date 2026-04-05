import { COLORS as THEME_COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { user, fullData, refreshFullData } = useAuth();
  const {
    expenses,
    isLoading: expLoading,
    totalSpent,
    refresh: refreshExp,
  } = useExpenses();
  const { banks, isLoading: bankLoading, refresh: refreshBanks } = useBanks();
  const { theme, toggleTheme, colors: COLORS } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const settings: any = fullData?.settings || fullData?.user || user || {};

  const salary = parseFloat(settings.salary || "0");
  const savingGoal = parseFloat(
    settings.savingGoal || settings.saving_goal || "0",
  );
  const fixedExpenses = parseFloat(
    settings.fixedExpenses || settings.fixed_expenses || "0",
  );

  const variablePool = salary - savingGoal - fixedExpenses;
  const budgetLeft = variablePool - totalSpent;
  const consumptionPerc = Math.min((totalSpent / variablePool) * 100, 100);

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const currentDay = new Date().getDate();
  const remainingDays = Math.max(daysInMonth - currentDay + 1, 1);

  const safeDailyLimit = variablePool / 30;
  const actionableToday = Math.max(budgetLeft / remainingDays, 0);

  const firstName = user?.name?.split(" ")[0] || "User";
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const refresh = async () => {
    await refreshFullData();
  };

  const getBankName = (id: number) =>
    banks.find((b) => b.id === id)?.name || "Unknown Bank";

  const recentExpenses = useMemo(() => {
    return expenses
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);
  }, [expenses]);

  const categorySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + e.amount;
    });
    return Object.entries(counts)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses]);

  const styles = useMemo(() => createStyles(COLORS, theme), [COLORS, theme]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Header Section */}
      <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 60 }]}>
        <View>
          <Text style={styles.greetingText}>Hi, {firstName}</Text>
          <Text style={styles.dateSubtext}>
            {todayStr}
            {"\n"}₹{Math.max(budgetLeft, 0).toLocaleString()} available
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={[styles.themeBtn, { backgroundColor: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]} 
            onPress={toggleTheme}
          >
            <Ionicons 
              name={theme === 'dark' ? "sunny-sharp" : "moon-sharp"} 
              size={20} 
              color={theme === 'dark' ? COLORS.accent : COLORS.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellIcon}>
            <Ionicons name="notifications" size={20} color={COLORS.accent} />
            <View style={styles.pingBadge} />
          </TouchableOpacity>
          <Avatar user={user} size={44} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={expLoading || bankLoading}
            onRefresh={refresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Global Variable Pool Card */}
        <View style={styles.poolCard}>
          <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.poolInner}>
            <View style={styles.poolBadge}>
              <View style={styles.poolDot} />
              <Text style={styles.poolBadgeText}>VARIABLE POOL</Text>
            </View>
            <Text style={styles.poolAmount}>
              ₹{Math.max(budgetLeft, 0).toLocaleString()}
            </Text>
            <Text style={styles.poolSubtext}>
              After savings & fixed bills · Mar 2026
            </Text>

            <View style={styles.budgetProgressRow}>
              <Text style={styles.progressLabel}>
                Budget consumed this month
              </Text>
              <Text style={styles.progressValue}>
                {consumptionPerc.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${consumptionPerc}%` },
                ]}
              />
            </View>

            <View style={styles.splitLimitRow}>
              <View style={[styles.limitBox, { backgroundColor: theme === 'dark' ? "#1e293b" : "rgba(0,0,0,0.05)" }]}>
                <Text style={styles.limitLabel}>SAFE DAILY</Text>
                <Text style={styles.limitValue}>
                  ₹{safeDailyLimit.toFixed(0)}
                </Text>
              </View>
              <View
                style={[
                  styles.limitBox,
                  {
                    backgroundColor: "rgba(245, 158, 11, 0.08)",
                    borderColor: "rgba(245, 158, 11, 0.2)",
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={styles.actionableHeader}>
                  <Ionicons name="flash" size={12} color={COLORS.accent} />
                  <Text
                    style={[
                      styles.limitLabel,
                      { color: COLORS.accent, marginLeft: 4 },
                    ]}
                  >
                    ACTIONABLE TODAY
                  </Text>
                </View>
                <Text style={[styles.limitValue, { color: COLORS.accent }]}>
                  ₹{actionableToday.toFixed(0)}
                </Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Categories Breakdown Section */}
        <View style={styles.breakdownCard}>
          <View
            style={[
              styles.donutPlaceholder,
              {
                borderTopColor:
                  consumptionPerc > 5 ? COLORS.primary : COLORS.border,
                borderRightColor:
                  consumptionPerc > 25 ? COLORS.primary : COLORS.border,
                borderBottomColor:
                  consumptionPerc > 50 ? COLORS.primary : COLORS.border,
                borderLeftColor:
                  consumptionPerc > 75 ? COLORS.primary : COLORS.border,
                transform: [{ rotate: "45deg" }], // Rotate so top starts at 0 visually inside the curve
              },
            ]}
          >
            <View
              style={{
                transform: [{ rotate: "-45deg" }],
                alignItems: "center",
              }}
            >
              <Text style={styles.donutCenterValue}>
                ₹{(totalSpent / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.donutCenterLabel}>SPENT</Text>
            </View>
          </View>
          <View style={styles.legendContainer}>
            {categorySummary.map((cat, i) => (
              <View key={cat.name} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: Object.values(COLORS.categories)[i % 5],
                    },
                  ]}
                />
                <Text style={styles.legendName} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={styles.legendAmount}>
                  ₹{cat.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S TRANSACTIONS</Text>
            <TouchableOpacity onPress={() => router.push("/expenses")}>
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionList}>
            {recentExpenses.map((ex) => (
              <View key={ex.id} style={styles.txItem}>
                <View style={styles.txIconBox}>
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color={COLORS.text}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>
                    {ex.description || ex.category}
                  </Text>
                  <Text style={styles.txSub}>
                    {ex.category} · {getBankName(ex.bank_id)}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>
                    -₹{ex.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.txTime}>12:34 PM</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Your Accounts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR ACCOUNTS</Text>
            <TouchableOpacity onPress={() => router.push("/banks")}>
              <Text style={styles.seeAllText}>Manage →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bankCarousel}
          >
            {banks.map((bank, i) => (
              <TouchableOpacity
                key={bank.id}
                style={[
                  styles.bankCard,
                  {
                    borderColor:
                      i % 2 === 0
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(16, 185, 129, 0.2)",
                  },
                ]}
                onPress={() => router.push("/banks")}
              >
                <Text style={styles.bankIdLabel}>{bank.name}</Text>
                <Text style={styles.bankCardBalance}>
                  ₹{parseFloat(bank.balance.toString()).toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.bankTypeBadge,
                    {
                      backgroundColor:
                        i % 2 === 0
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(16, 185, 129, 0.15)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bankTypeText,
                      { color: i % 2 === 0 ? "#3b82f6" : "#10b981" },
                    ]}
                  >
                    {bank.purpose?.toUpperCase() || "ACTIVE"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: any, theme: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  dateSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
  bellIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  pingBadge: {
    position: "absolute",
    top: 12,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  poolCard: {
    backgroundColor: theme === 'dark' ? "rgba(15, 23, 42, 0.5)" : "rgba(0, 0, 0, 0.03)",
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    marginBottom: 25,
  },
  poolInner: { padding: 24 },
  poolBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  poolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  poolBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  poolAmount: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -1,
  },
  poolSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "500",
  },
  budgetProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  progressValue: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  progressBarBg: {
    height: 8,
    backgroundColor: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  splitLimitRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  limitBox: { flex: 1, padding: 18, borderRadius: 20 },
  actionableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  limitLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  limitValue: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  breakdownCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    marginBottom: 30,
    alignItems: "center",
    gap: 20,
  },
  donutPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  donutCenterValue: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  donutCenterLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "800",
  },
  legendContainer: { flex: 1, gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  legendName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  legendAmount: { fontSize: 12, fontWeight: "800", color: COLORS.text },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  seeAllText: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  transactionList: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 10,
  },
  txItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  txInfo: { flex: 1, marginLeft: 16 },
  txTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  txSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 15, fontWeight: "900", color: COLORS.danger },
  txTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  bankCarousel: { gap: 15 },
  bankCard: {
    width: 180,
    height: 110,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  bankIdLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  bankCardBalance: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  bankTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bankTypeText: { fontSize: 9, fontWeight: "900" },
});
