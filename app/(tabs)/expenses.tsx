import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Expenses() {
  const { expenses, isLoading, refresh } = useExpenses();

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof expenses> = {};
    expenses.forEach((e) => {
      const date = e.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
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
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groupedExpenses}
        keyExtractor={(item) => item[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#6366f1"
          />
        }
        renderItem={({ item: [date, items] }) => (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{date}</Text>
            <View style={styles.groupItems}>
              {items.map((tx) => (
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
                    <Text style={styles.txTime}>
                      {tx.created_at.split("T")[1].substring(0, 5)}
                    </Text>
                  </View>
                  <Text style={styles.txAmount}>
                    -₹{tx.amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color="#334155" />
              <Text style={styles.emptyText}>No expenses yet</Text>
            </View>
          ) : (
            <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
          )
        }
      />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f1f5f9",
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  groupItems: {
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
  txTime: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f87171",
  },
  empty: {
    marginTop: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
});
