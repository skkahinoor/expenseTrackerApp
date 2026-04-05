import { COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function Settings() {
  const { user, fullData, token, refreshFullData, updateSettings } = useAuth();
  const { banks, refresh: refreshBanks } = useBanks();
  const { height } = Dimensions.get("window");
  const EDIT_SHEET_HEIGHT = Math.min(
    680,
    Math.max(500, Math.round(height * 0.85)),
  );

  // Notification Toggles
  const [notif80, setNotif80] = useState(true);
  const [notif100, setNotif100] = useState(true);
  const [notifSummary, setNotifSummary] = useState(false);
  const [notifSmart, setNotifSmart] = useState(true);

  const settings: any = fullData?.settings || fullData?.user || user || {};

  const getBudgetDefaults = () => ({
    salary: (settings.salary || "0").toString(),
    creditBank: (
      settings.salaryBankId ||
      settings.salary_bank_id ||
      settings.creditBank ||
      settings.credit_bank_id ||
      ""
    ).toString(),
    creditNow: Boolean(
      settings.creditSalary ??
      settings.credit_salary ??
      settings.creditNow ??
      settings.credit_now ??
      false
    ),
    savingGoal: (settings.savingGoal || settings.saving_goal || "0").toString(),
    fixedExpenses: (
      settings.fixedExpenses ||
      settings.fixed_expenses ||
      "0"
    ).toString(),
  });

  const [budgetSheetVisible, setBudgetSheetVisible] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetForm, setBudgetForm] = useState(getBudgetDefaults());

  const openBudgetSheet = () => {
    setBudgetForm(getBudgetDefaults());
    setBudgetSheetVisible(true);
  };

  const handleSaveBudget = async () => {
    if (budgetSaving) return;
    setBudgetSaving(true);
    try {
      const parsedSalary = parseFloat(budgetForm.salary || "0") || 0;
      const parsedSavingGoal = parseFloat(budgetForm.savingGoal || "0") || 0;
      const parsedFixedExpenses =
        parseFloat(budgetForm.fixedExpenses || "0") || 0;

      const parsedSalaryBankId = parseInt(budgetForm.creditBank || "0", 10);
      const fallbackSalaryBankId =
        parseInt(settings.salaryBankId || settings.salary_bank_id || "0", 10) ||
        parseInt(budgetForm.creditBank || "0", 10) ||
        banks.filter((b: any) => b.purpose?.toLowerCase() !== "prepaid")[0]
          ?.id ||
        0;

      const salaryBankId = parsedSalaryBankId > 0 ? parsedSalaryBankId : fallbackSalaryBankId;

      await updateSettings({
        salary: parsedSalary,
        savingGoal: parsedSavingGoal,
        fixedExpenses: parsedFixedExpenses,
        salaryBankId: salaryBankId,
        salary_bank_id: salaryBankId, // redundancy
        creditSalary: budgetForm.creditNow,
        credit_salary: budgetForm.creditNow, // redundancy
      });

      // Refresh banks if we just credited salary
      if (budgetForm.creditNow) {
        await refreshBanks().catch(() => {});
      }

      setBudgetSheetVisible(false);
    } catch (e: any) {
      console.error("Failed to save budget:", e);
    } finally {
      setBudgetSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Settings </Text>
          </View>
          <Text style={styles.subtitle}>Budget & notification goals</Text>
        </View>
        <Avatar user={user} size={44} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Budget Framework */}
        <Text style={styles.sectionTitle}>BUDGET FRAMEWORK</Text>
        <View style={styles.frameworkCard}>
          <View style={styles.frameworkHeaderRow}>
            <View style={styles.frameworkHeaderLeft}>
              <Ionicons name="document-text" size={18} color={COLORS.primary} />
              <Text style={styles.frameworkHeaderText}>Budget Values</Text>
            </View>
            <TouchableOpacity
              style={styles.inlineEditBtn}
              onPress={openBudgetSheet}
            >
              <Ionicons name="pencil" size={16} color={COLORS.text} />
              <Text style={styles.inlineEditText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.frameworkItem}>
            <View style={styles.iconBox}>
              <Text style={styles.emoji}>💰</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Monthly Salary</Text>
              <Text style={styles.itemSub}>Primary income source</Text>
              <Text style={styles.itemValue}>
                ₹
                {parseFloat(
                  (settings.salary || "0").toString(),
                ).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.frameworkItem}>
            <View style={styles.iconBox}>
              <Text style={styles.emoji}>🎯</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Savings Goal</Text>
              <Text style={styles.itemSub}>Monthly target</Text>
              <Text style={styles.itemValue}>
                ₹
                {parseFloat(
                  (
                    settings.savingGoal ||
                    settings.saving_goal ||
                    "0"
                  ).toString(),
                ).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.frameworkItem}>
            <View style={styles.iconBox}>
              <Text style={styles.emoji}>📋</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Fixed Expenses</Text>
              <Text style={styles.itemSub}>Rent, EMIs, subscriptions</Text>
              <Text style={styles.itemValue}>
                ₹
                {parseFloat(
                  (
                    settings.fixedExpenses ||
                    settings.fixed_expenses ||
                    "0"
                  ).toString(),
                ).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.frameworkCard}>
          <View style={styles.notifItem}>
            <View style={styles.iconBox}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>80% Limit Alert</Text>
              <Text style={styles.itemSub}>Warn when nearing daily limit</Text>
            </View>
            <Switch
              value={notif80}
              onValueChange={setNotif80}
              trackColor={{ false: "#334155", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.notifItem}>
            <View style={styles.iconBox}>
              <Ionicons name="notifications-circle" size={20} color="#ef4444" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>100% Limit Alert</Text>
              <Text style={styles.itemSub}>Notify when limit exceeded</Text>
            </View>
            <Switch
              value={notif100}
              onValueChange={setNotif100}
              trackColor={{ false: "#334155", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.notifItem}>
            <View style={styles.iconBox}>
              <Ionicons name="bar-chart" size={18} color="#3b82f6" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Daily Summary</Text>
              <Text style={styles.itemSub}>Evening spending recap</Text>
            </View>
            <Switch
              value={notifSummary}
              onValueChange={setNotifSummary}
              trackColor={{ false: "#334155", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.notifItem}>
            <View style={styles.iconBox}>
              <Ionicons name="bulb-sharp" size={20} color="#fbbf24" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Smart Suggestions</Text>
              <Text style={styles.itemSub}>AI spend recommendations</Text>
            </View>
            <Switch
              value={notifSmart}
              onValueChange={setNotifSmart}
              trackColor={{ false: "#334155", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      {/* Half-floating edit sheet for budget */}
      <Modal visible={budgetSheetVisible} transparent animationType="fade">
        <View style={styles.sheetOverlay}>
          <TouchableWithoutFeedback
            onPress={() => setBudgetSheetVisible(false)}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[styles.sheet, { height: EDIT_SHEET_HEIGHT }]}>
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Budget</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setBudgetSheetVisible(false)}
              >
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
            >
              <Text style={styles.sheetLabel}>Monthly Salary (₹)</Text>
              <View style={styles.sheetInputContainer}>
                <TextInput
                  style={styles.sheetInput}
                  keyboardType="numeric"
                  value={budgetForm.salary}
                  onChangeText={(val) =>
                    setBudgetForm({ ...budgetForm, salary: val })
                  }
                />
              </View>

              <Text style={styles.sheetLabel}>Receive Salary In</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 15 }}
                contentContainerStyle={{ gap: 10 }}
              >
                {banks
                  .filter((b: any) => b.purpose?.toLowerCase() !== "prepaid")
                  .map((b: any) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.inlineEditBtn,
                        budgetForm.creditBank === b.id.toString() && {
                          borderColor: COLORS.primary,
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                        },
                      ]}
                      onPress={() =>
                        setBudgetForm({
                          ...budgetForm,
                          creditBank: b.id.toString(),
                        })
                      }
                    >
                      <Ionicons
                        name="business"
                        size={14}
                        color={
                          budgetForm.creditBank === b.id.toString()
                            ? COLORS.primary
                            : COLORS.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.inlineEditText,
                          budgetForm.creditBank === b.id.toString() && {
                            color: COLORS.primary,
                          },
                        ]}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              {budgetForm.creditBank !== "" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 18,
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 13,
                      flex: 1,
                      marginRight: 10,
                    }}
                  >
                    Credit this salary (₹{budgetForm.salary || 0}) to{" "}
                    {
                      banks.find(
                        (b: any) => b.id.toString() === budgetForm.creditBank,
                      )?.name
                    }{" "}
                    now?
                  </Text>
                  <Switch
                    value={budgetForm.creditNow}
                    onValueChange={(v) =>
                      setBudgetForm({ ...budgetForm, creditNow: v })
                    }
                    trackColor={{ false: "#334155", true: "#3b82f6" }}
                    thumbColor="#fff"
                  />
                </View>
              )}

              <Text style={styles.sheetLabel}>Savings Goal (₹)</Text>
              <View style={styles.sheetInputContainer}>
                <TextInput
                  style={styles.sheetInput}
                  keyboardType="numeric"
                  value={budgetForm.savingGoal}
                  onChangeText={(val) =>
                    setBudgetForm({ ...budgetForm, savingGoal: val })
                  }
                />
              </View>

              <Text style={styles.sheetLabel}>Fixed Expenses (₹)</Text>
              <View style={styles.sheetInputContainer}>
                <TextInput
                  style={styles.sheetInput}
                  keyboardType="numeric"
                  value={budgetForm.fixedExpenses}
                  onChangeText={(val) =>
                    setBudgetForm({ ...budgetForm, fixedExpenses: val })
                  }
                />
              </View>

              <View style={{ height: 14 }} />

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 20,
                  marginTop: 5,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.textMuted,
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      Variable Pool
                    </Text>
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontSize: 8,
                        fontWeight: "900",
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      MONTHLY
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 18,
                      fontWeight: "900",
                      marginTop: 10,
                    }}
                  >
                    ₹
                    {Math.max(
                      (parseFloat(budgetForm.salary) || 0) -
                        (parseFloat(budgetForm.savingGoal) || 0) -
                        (parseFloat(budgetForm.fixedExpenses) || 0),
                      0,
                    ).toFixed(2)}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.textMuted,
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      Daily Limit
                    </Text>
                    <Text
                      style={{
                        color: COLORS.success,
                        fontSize: 8,
                        fontWeight: "900",
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      DAILY
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 18,
                      fontWeight: "900",
                      marginTop: 10,
                    }}
                  >
                    ₹
                    {(
                      Math.max(
                        (parseFloat(budgetForm.salary) || 0) -
                          (parseFloat(budgetForm.savingGoal) || 0) -
                          (parseFloat(budgetForm.fixedExpenses) || 0),
                        0,
                      ) /
                      new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        0,
                      ).getDate()
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetSecondaryBtn}
                  onPress={() => setBudgetSheetVisible(false)}
                >
                  <Text style={styles.sheetSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetPrimaryBtn}
                  onPress={handleSaveBudget}
                  disabled={budgetSaving}
                >
                  <Text style={styles.sheetPrimaryText}>
                    {budgetSaving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 6 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  frameworkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frameworkItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 18 },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemLabel: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  itemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  itemValue: { fontSize: 15, fontWeight: "900", color: COLORS.primary },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginHorizontal: 15,
  },
  notifItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  headerRightSpacer: { width: 44, height: 44 },

  frameworkHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  frameworkHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  frameworkHeaderText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },
  inlineEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inlineEditText: { color: COLORS.text, fontWeight: "900", fontSize: 13 },

  // Half-floating sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandleWrap: { alignItems: "center", paddingVertical: 8 },
  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  sheetScroll: { paddingBottom: 18 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sheetInputContainer: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  sheetInput: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
  },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetSecondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  sheetSecondaryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "900",
  },
  sheetPrimaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
