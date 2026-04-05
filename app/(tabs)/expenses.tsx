import { COLORS } from "@/constants/theme";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Expenses() {
  const {
    expenses,
    transfers,
    isLoading,
    refresh,
    deleteExpense,
    deleteTransfer,
  } = useExpenses();
  const router = useRouter();

  const allTransactions = useMemo(() => {
    const combined = [
      ...expenses.map((e) => ({ ...e, type: "expense" })),
      ...transfers.map((t) => ({
        id: t.id,
        amount: t.amount,
        description:
          t.description ||
          `Transfer: ${t.from_bank?.name || "Bank"} ➔ ${t.to_bank?.name || "Bank"}`,
        category: "Transfer",
        date: t.date,
        created_at: t.created_at,
        type: "transfer",
      })),
    ];

    // Sort all individual items by true timestamp first to prevent hidden/lost transactions
    combined.sort(
      (a, b) =>
        new Date(b.created_at || b.date).getTime() -
        new Date(a.created_at || a.date).getTime(),
    );

    const groups: Record<string, any[]> = {};
    combined.forEach((tx) => {
      // Create a clean readable date, e.g. "15 Mar 2024"
      const dateObj = new Date(tx.date || tx.created_at);
      const displayDate = dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (!groups[displayDate]) groups[displayDate] = [];
      groups[displayDate].push(tx);
    });

    // Object.entries preserves the insertion order which is already sorted correctly from the combined sort above
    return Object.entries(groups);
  }, [expenses, transfers]);

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
      case "Transfer":
        return "#8b5cf6";
      default:
        return COLORS.primary;
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
      case "Transfer":
        return "swap-horizontal-outline";
      default:
        return "list-outline";
    }
  };

  const handleDelete = (tx: any) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (tx.type === "expense") await deleteExpense(tx.id);
              else await deleteTransfer(tx.id);
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>All Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={allTransactions}
        keyExtractor={(item) => item[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item: [date, items] }) => (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{date}</Text>
            <View style={styles.groupItems}>
              {items.map((tx) => (
                <TouchableOpacity
                  key={`${tx.type}-${tx.id}`}
                  style={styles.transactionItem}
                  onLongPress={() => handleDelete(tx)}
                  activeOpacity={0.7}
                >
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
                    <Text style={styles.txLabel} numberOfLines={1}>
                      {tx.description || tx.category}
                    </Text>
                    <Text style={styles.txTime}>
                      {tx.created_at || tx.date
                        ? new Date(tx.created_at || tx.date).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )
                        : "--:--"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      tx.type === "transfer" && { color: COLORS.primary },
                    ]}
                  >
                    {tx.type === "transfer" ? "" : "-"}₹
                    {tx.amount.toLocaleString("en-IN")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons
                name="receipt-outline"
                size={56}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No history found</Text>
            </View>
          ) : (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginTop: 40 }}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  groupItems: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  txTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: "700", color: COLORS.danger },
  empty: { marginTop: 100, alignItems: "center" },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 12,
  },
});
