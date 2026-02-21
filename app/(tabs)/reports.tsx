import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Reports() {
  const { expenses, totalSpent, categoryTotals } = useExpenses();

  const sortedCategories = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      }));
  }, [categoryTotals, totalSpent]);

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
      case "Entertainment":
        return "#8b5cf6";
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
      case "Entertainment":
        return "game-controller-outline";
      default:
        return "list-outline";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.header}>
        <Text style={styles.title}>Spending Analysis</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Total Chart Placeholder */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent this Month</Text>
          <Text style={styles.summaryAmount}>
            ₹{totalSpent.toLocaleString("en-IN")}
          </Text>

          <View style={styles.chartBar}>
            {sortedCategories.map((cat, i) => (
              <View
                key={cat.name}
                style={{
                  height: 12,
                  width: `${cat.percentage}%`,
                  backgroundColor: getCategoryColor(cat.name),
                  borderRadius: i === 0 ? 6 : 0,
                  borderTopRightRadius:
                    i === sortedCategories.length - 1 ? 6 : 0,
                  borderBottomRightRadius:
                    i === sortedCategories.length - 1 ? 6 : 0,
                }}
              />
            ))}
          </View>
        </View>

        {/* Breakdown */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <View style={styles.breakdownList}>
          {sortedCategories.length > 0 ? (
            sortedCategories.map((cat) => (
              <View key={cat.name} style={styles.breakdownItem}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: getCategoryColor(cat.name) + "22" },
                  ]}
                >
                  <Ionicons
                    name={getCategoryIcon(cat.name) as any}
                    size={20}
                    color={getCategoryColor(cat.name)}
                  />
                </View>
                <View style={styles.info}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catPercentage}>
                    {cat.percentage.toFixed(1)}% of total
                  </Text>
                </View>
                <Text style={styles.catAmount}>
                  ₹{cat.amount.toLocaleString("en-IN")}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No data to analyze</Text>
            </View>
          )}
        </View>

        {/* Insights */}
        {sortedCategories.length > 0 && (
          <View style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={24} color="#6366f1" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Insight</Text>
              <Text style={styles.insightText}>
                Your biggest expense category is{" "}
                <Text style={{ fontWeight: "700", color: "#f1f5f9" }}>
                  {sortedCategories[0].name}
                </Text>
                , accounting for {sortedCategories[0].percentage.toFixed(0)}% of
                your spending.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f1f5f9",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 30,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 24,
  },
  chartBar: {
    height: 12,
    width: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 16,
  },
  breakdownList: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    marginBottom: 24,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  catName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  catPercentage: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  catAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#6366f11a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#6366f144",
    alignItems: "flex-start",
  },
  insightContent: {
    flex: 1,
    marginLeft: 16,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#818cf8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  insightText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  empty: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },
});
