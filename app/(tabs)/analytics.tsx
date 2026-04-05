import { COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { Expense, useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Analytics() {
  const { expenses, totalSpent, refresh, isLoading } = useExpenses();
  const { user, fullData } = useAuth();

  const settings: any = fullData?.settings || fullData?.user || user || {};
  const salary = parseFloat(settings.salary || "0");
  const savingsGoal = parseFloat(
    settings.savingGoal || settings.saving_goal || "0",
  );
  const fixedExpenses = parseFloat(
    settings.fixedExpenses || settings.fixed_expenses || "0",
  );
  const variablePool = salary - savingsGoal - fixedExpenses;
  const variablePoolSafe = Math.max(variablePool, 1);

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const last7StartIso = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [draftStart, setDraftStart] = useState(last7StartIso);
  const [draftEnd, setDraftEnd] = useState(todayIso);
  const [rangeStart, setRangeStart] = useState(last7StartIso);
  const [rangeEnd, setRangeEnd] = useState(todayIso);

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();

  const currentDay = today.getDate();
  const projectedSpend = (totalSpent / Math.max(currentDay, 1)) * daysInMonth;
  const overSafeBudget = Math.max(projectedSpend - variablePool, 0);

  const parseRangeDays = (startIso: string, endIso: string) => {
    const s = new Date(`${startIso}T00:00:00`);
    const e = new Date(`${endIso}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;
    const diffMs = e.getTime() - s.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(1, diffDays + 1);
  };

  const rangeDays = useMemo(
    () => parseRangeDays(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );

  const rangeBudget =
    Math.max(variablePool, 0) * (rangeDays / Math.max(daysInMonth, 1));

  const rangeExpenses = useMemo(() => {
    // Server returns YYYY-MM-DD, so lexicographic compare works.
    return expenses
      .filter((e) => e.date && e.date >= rangeStart && e.date <= rangeEnd)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, rangeStart, rangeEnd]);

  const rangeSpent = useMemo(
    () => rangeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [rangeExpenses],
  );

  const rangeCategoryTotals = useMemo(() => {
    return rangeExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
  }, [rangeExpenses]);

  const sortedCategories = useMemo(() => {
    const denom = Math.max(rangeBudget, 1);
    return Object.entries(rangeCategoryTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          rangeSpent > 0 ? Math.min((amount / rangeSpent) * 100, 100) : 0,
        limitPerc: (amount / (denom / 4)) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [rangeCategoryTotals, rangeBudget, rangeSpent]);

  type DailySection = {
    isoDate: string; // YYYY-MM-DD
    total: number;
    items: Expense[];
  };

  const dailySections = useMemo(() => {
    const map: Record<string, DailySection> = {};
    rangeExpenses.forEach((e) => {
      const isoDate = (e.date || "").slice(0, 10);
      if (!isoDate) return;
      if (!map[isoDate]) {
        map[isoDate] = { isoDate, total: 0, items: [] };
      }
      map[isoDate].total += e.amount || 0;
      map[isoDate].items.push(e);
    });

    return Object.values(map).sort((a, b) =>
      b.isoDate.localeCompare(a.isoDate),
    );
  }, [rangeExpenses]);

  const maxDailyAmount = Math.max(1, ...dailySections.map((d) => d.total));

  const formatIsoToShortDay = (isoDate: string) => {
    const dt = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return isoDate;
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isValidIsoDate = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso);

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [exportingPdf, setExportingPdf] = useState(false);

  const applyRange = () => {
    if (!isValidIsoDate(draftStart) || !isValidIsoDate(draftEnd)) {
      Alert.alert("Invalid date", "Use format YYYY-MM-DD.");
      return;
    }
    if (draftStart > draftEnd) {
      Alert.alert("Invalid range", "Start date must be before end date.");
      return;
    }
    const days = parseRangeDays(draftStart, draftEnd);
    if (days > 90) {
      Alert.alert("Range too large", "Please select a range up to 90 days.");
      return;
    }
    setRangeStart(draftStart);
    setRangeEnd(draftEnd);
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("Food")) return COLORS.categories.food;
    if (cat.includes("Rent")) return COLORS.categories.rent;
    if (cat.includes("Transport")) return COLORS.categories.transport;
    if (cat.includes("Shopping")) return COLORS.categories.shopping;
    return COLORS.categories.others;
  };

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    if (rangeExpenses.length === 0) {
      Alert.alert("No data", "No transactions found in the selected range.");
      return;
    }

    setExportingPdf(true);
    try {
      const startLabel = formatIsoToShortDay(rangeStart);
      const endLabel = formatIsoToShortDay(rangeEnd);
      const txRows = dailySections
        .map((day) => {
          const dayRows = day.items
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((t) => {
              const desc = t.description ? ` (${t.description})` : "";
              return `
                <tr>
                  <td>${escapeHtml(t.category)}</td>
                  <td>${escapeHtml(desc.trim())}</td>
                  <td style="text-align:right;">₹${t.amount.toLocaleString()}</td>
                </tr>
              `;
            })
            .join("");

          return `
            <tbody>
              <tr>
                <td colspan="3" style="font-weight:700;padding-top:14px;">
                  ${escapeHtml(day.isoDate)} · ₹${day.total.toLocaleString()}
                </td>
              </tr>
              ${dayRows}
            </tbody>
          `;
        })
        .join("");

      const categoryRows = sortedCategories
        .slice(0, 10)
        .map(
          (c) => `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td style="text-align:right;">₹${c.amount.toLocaleString()}</td>
          </tr>
        `,
        )
        .join("");

      const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Analytics Export</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; padding: 30px; color:#0f172a; }
            h1 { font-size: 24px; margin: 0 0 10px 0; color: #1e40af; }
            .sub { font-size: 14px; color:#475569; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
            .card { border:1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .row { display:flex; gap: 12px; justify-content: space-between; }
            .pill { background:#f1f5f9; padding:8px 12px; border-radius:999px; font-size:13px; font-weight:600; }
            table { width:100%; border-collapse: collapse; font-size: 13px; }
            th, td { border-bottom: 1px solid #f1f5f9; padding: 10px 8px; vertical-align: top; }
            th { text-align:left; font-weight:700; color:#475569; background-color: #f8fafc; }
            td { color:#1e293b; }
            .total { font-weight: 700; color: #1e40af; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Expense Tracker Report</h1>
          <div class="sub">
            Period: <b>${escapeHtml(startLabel)}</b> – <b>${escapeHtml(endLabel)}</b><br/>
            Transactions: <b>${rangeExpenses.length}</b> | Total Spent: <b>₹${rangeSpent.toLocaleString()}</b>
          </div>
          
          <h2>Summary by Category</h2>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRows}
              </tbody>
            </table>
          </div>

          <h2>Daily Transactions</h2>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th style="width:140px;">Category/Date</th>
                  <th>Description</th>
                  <th style="width:100px;text-align:right;">Amount</th>
                </tr>
              </thead>
              ${txRows}
            </table>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 40px;">Generated by ExpenseTracker App</p>
        </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: "Download My Expense Report",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e: any) {
      Alert.alert("Export failed", e?.message || "Could not export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    if (name.includes("Food")) return "fast-food-outline";
    if (name.includes("Rent")) return "home-outline";
    if (name.includes("Transport")) return "car-outline";
    return "cart-outline";
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
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>
            {formatIsoToShortDay(rangeStart)} - {formatIsoToShortDay(rangeEnd)}{" "}
            · {rangeExpenses.length} transactions
          </Text>
        </View>
        <Avatar user={user} size={44} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Date range + export */}
        <View style={styles.rangeCard}>
          <View style={styles.rangeTopRow}>
            <View style={styles.rangeField}>
              <Text style={styles.rangeLabel}>From</Text>
              <TextInput
                value={draftStart}
                onChangeText={setDraftStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                style={styles.rangeInput}
              />
            </View>
            <View style={styles.rangeField}>
              <Text style={styles.rangeLabel}>To</Text>
              <TextInput
                value={draftEnd}
                onChangeText={setDraftEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.rangeActions}>
            <TouchableOpacity style={styles.rangeApplyBtn} onPress={applyRange}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.rangeApplyText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rangeExportBtn,
                (exportingPdf || rangeExpenses.length === 0) && {
                  opacity: 0.6,
                },
              ]}
              onPress={handleExportPdf}
              disabled={exportingPdf || rangeExpenses.length === 0}
            >
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={styles.rangeExportText}>
                {exportingPdf ? "Preparing..." : "Export PDF"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.rangeMeta}>
            Total spent in range: ₹{rangeSpent.toLocaleString()}
          </Text>
        </View>

        {/* Projected Outlook Card */}
        <View style={styles.outlookCard}>
          <BlurView intensity={20} tint="dark" style={styles.outlookInner}>
            <View style={styles.outlookHeader}>
              <Ionicons name="warning-outline" size={12} color="#f59e0b" />
              <Text style={styles.outlookBadgeText}>
                PROJECTED MONTH-END SPEND
              </Text>
            </View>
            <Text style={styles.outlookValue}>
              ₹
              {projectedSpend.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
            <Text style={styles.outlookSub}>
              ₹
              {overSafeBudget.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              over safe budget · at current daily pace
            </Text>

            <View style={styles.outlookProgressBg}>
              <View
                style={[
                  styles.outlookProgressFill,
                  {
                    width: `${Math.min((projectedSpend / variablePoolSafe) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.outlookPerc}>
              {((projectedSpend / variablePoolSafe) * 100).toFixed(0)}% of
              budget
            </Text>
          </BlurView>
        </View>

        {/* Spending Trend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Trend</Text>
            <Text style={styles.sectionMetaText}>
              {dailySections.length > 0
                ? `${dailySections.length} day${dailySections.length === 1 ? "" : "s"}`
                : "No data"}
            </Text>
          </View>
          <View style={[styles.chartArea, { paddingTop: 18, height: 170 }]}>
            {dailySections.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={styles.chartBarsContainer}
              >
                {dailySections
                  .slice()
                  .reverse()
                  .map((day, i) => {
                    const heightPerc = (day.total / maxDailyAmount) * 100;
                    const isLast = i === dailySections.length - 1;
                    return (
                      <View key={day.isoDate} style={styles.chartBarWrap}>
                        <Text style={styles.chartAmountText}>
                          ₹
                          {day.total >= 1000
                            ? (day.total / 1000).toFixed(1) + "k"
                            : day.total.toLocaleString()}
                        </Text>
                        <View style={styles.chartBarBg}>
                          <View
                            style={[
                              styles.chartBarFill,
                              {
                                height: `${heightPerc}%`,
                                backgroundColor: isLast
                                  ? COLORS.primary
                                  : COLORS.accent,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.chartDayText}>
                          {day.isoDate.slice(8, 10)}
                        </Text>
                      </View>
                    );
                  })}
              </ScrollView>
            ) : (
              <View style={styles.chartEmpty}>
                <Ionicons
                  name="bar-chart-outline"
                  size={32}
                  color={COLORS.textMuted}
                />
                <Text style={styles.chartEmptyText}>No recent data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Categorized Breakdown */}
        <Text style={styles.sectionTitle}>BY CATEGORY</Text>
        {sortedCategories.map((cat) => (
          <View key={cat.name} style={styles.catCard}>
            <View style={styles.catIconBox}>
              <Ionicons
                name={getCategoryIcon(cat.name) as any}
                size={20}
                color={COLORS.text}
              />
            </View>
            <View style={styles.catInfo}>
              <View style={styles.catHeader}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catAmount}>
                  ₹{cat.amount.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.catLimitText}>
                {cat.limitPerc.toFixed(0)}% of limit
              </Text>
              <View style={styles.catBarBg}>
                <View
                  style={[
                    styles.catBarFill,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor:
                        cat.limitPerc > 80 ? COLORS.danger : COLORS.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Daily Transactions List (with details) */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          DAILY TRANSACTIONS
        </Text>
        <View style={styles.historyList}>
          {dailySections.length > 0 ? (
            dailySections.map((day, i) => {
              const expanded = !!expandedDays[day.isoDate];
              const visibleItems = expanded ? day.items : day.items.slice(0, 3);
              const dayDotColor = getCategoryColor(
                day.items[0]?.category || "",
              );

              return (
                <View key={day.isoDate} style={styles.historyDayCard}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.historyDayHeader}
                    onPress={() =>
                      setExpandedDays((prev) => ({
                        ...prev,
                        [day.isoDate]: !prev[day.isoDate],
                      }))
                    }
                  >
                    <View style={styles.historyDayLeft}>
                      <View
                        style={[
                          styles.historyDot,
                          { backgroundColor: dayDotColor },
                        ]}
                      />
                      <View>
                        <Text style={styles.historyDayDate}>
                          {formatIsoToShortDay(day.isoDate)}
                          {day.isoDate === todayIso ? " · Today" : ""}
                        </Text>
                        <Text style={styles.historyDaySub}>
                          {day.items.length} transaction
                          {day.items.length === 1 ? "" : "s"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyDayRight}>
                      <Text style={styles.historyAmount}>
                        ₹{day.total.toLocaleString()}
                      </Text>
                      <View style={styles.historyBarBg}>
                        <View
                          style={[
                            styles.historyBarFill,
                            {
                              width: `${Math.min((day.total / maxDailyAmount) * 100, 100)}%`,
                              backgroundColor: COLORS.textMuted,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.historyTxList}>
                    {visibleItems.map((tx) => (
                      <View key={tx.id} style={styles.historyTxRow}>
                        <View
                          style={[
                            styles.txDot,
                            { backgroundColor: getCategoryColor(tx.category) },
                          ]}
                        />
                        <View style={styles.txInfo}>
                          <Text style={styles.txCategory} numberOfLines={1}>
                            {tx.category}
                          </Text>
                          <Text style={styles.txDesc} numberOfLines={1}>
                            {tx.description || "—"}
                          </Text>
                        </View>
                        <Text style={styles.txAmount}>
                          ₹{tx.amount.toLocaleString()}
                        </Text>
                      </View>
                    ))}

                    {day.items.length > 3 && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                          setExpandedDays((prev) => ({
                            ...prev,
                            [day.isoDate]: !prev[day.isoDate],
                          }))
                        }
                        style={styles.historyShowMore}
                      >
                        <Text style={styles.historyShowMoreText}>
                          {expanded
                            ? "Show less"
                            : `View ${day.items.length - 3} more`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.historyEmpty}>
              <Ionicons
                name="time-outline"
                size={26}
                color={COLORS.textMuted}
              />
              <Text style={styles.historyEmptyText}>
                No transactions in this range
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  scroll: { paddingHorizontal: 20 },
  rangeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rangeTopRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  rangeField: { flex: 1 },
  rangeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  rangeInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    height: 44,
    color: COLORS.text,
    fontWeight: "700",
  },
  rangeActions: { flexDirection: "row", gap: 12, marginBottom: 10 },
  rangeApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  rangeApplyText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  rangeExportBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  rangeExportText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  rangeMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  outlookCard: {
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  outlookInner: { padding: 24 },
  outlookHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  outlookBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#f59e0b",
    letterSpacing: 0.8,
  },
  outlookValue: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -1,
  },
  outlookSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: "500",
  },
  outlookProgressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    marginTop: 20,
    overflow: "hidden",
  },
  outlookProgressFill: {
    height: "100%",
    backgroundColor: "#f59e0b",
    borderRadius: 3,
  },
  outlookPerc: {
    fontSize: 10,
    fontWeight: "800",
    color: "#f59e0b",
    alignSelf: "flex-end",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  sectionMetaText: {
    color: COLORS.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleActive: { backgroundColor: COLORS.surfaceLighter },
  toggleTextActive: { color: COLORS.primary, fontSize: 11, fontWeight: "800" },
  toggleText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  chartArea: {
    height: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    justifyContent: "center",
  },
  chartBarsContainer: {
    alignItems: "flex-end",
    gap: 12,
    paddingBottom: 6,
    paddingHorizontal: 2,
  },
  chartBarWrap: {
    width: 52,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  chartAmountText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "800",
    textAlign: "center",
  },
  chartBarBg: {
    width: "100%",
    height: 110,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: { width: "100%", borderRadius: 10 },
  chartDayText: { fontSize: 10, color: COLORS.textMuted, fontWeight: "800" },
  chartEmpty: { height: 140, justifyContent: "center", alignItems: "center" },
  chartEmptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyChartLine: { height: 2, backgroundColor: COLORS.border, width: "100%" },
  catCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    gap: 16,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  catInfo: { flex: 1 },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  catName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  catAmount: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  catLimitText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 10,
  },
  catBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  catBarFill: { height: "100%", borderRadius: 3 },
  historyList: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 15,
  },
  historyDayCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12,
    marginBottom: 12,
  },
  historyDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyDayLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyDayRight: { flex: 1, alignItems: "flex-end" },
  historyDot: { width: 7, height: 7, borderRadius: 4 },
  historyDayDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "900",
  },
  historyDaySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  historyBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 2,
    overflow: "hidden",
  },
  historyBarFill: { height: "100%", borderRadius: 2 },
  historyAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "right",
  },
  historyTxList: { marginTop: 10 },
  historyTxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 13, color: COLORS.text, fontWeight: "900" },
  txDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  txAmount: { fontSize: 13, color: COLORS.text, fontWeight: "900" },
  historyShowMore: { paddingVertical: 6 },
  historyShowMoreText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 12,
    textAlign: "left",
  },
  historyEmpty: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  historyEmptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
  },
});
