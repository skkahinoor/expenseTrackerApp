import { COLORS } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { useExpenses } from "@/context/ExpenseContext";
import { useTodos } from "@/context/TodoContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DebugScreen() {
  const { user, token, refreshUser } = useAuth();
  const { banks, refresh: refreshBanks } = useBanks();
  const { expenses, transfers, refresh: refreshExp } = useExpenses();
  const { todos, refresh: refreshTodos } = useTodos();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTests = async () => {
    setLoading(true);
    const log: any[] = [];
    try {
      log.push({
        name: "Auth Check",
        status: token ? "OK" : "Missing Token",
        data: user,
      });

      // Test Banks
      await refreshBanks();
      log.push({
        name: "Banks API",
        status: "OK",
        count: banks.length,
        data: banks,
      });

      // Test Expenses
      await refreshExp();
      log.push({
        name: "Expenses API",
        status: "OK",
        count: expenses.length,
        data: expenses,
      });
      log.push({
        name: "Transfers API",
        status: "OK",
        count: transfers.length,
        data: transfers,
      });

      // Test Todos
      await refreshTodos();
      log.push({
        name: "Todos API",
        status: "OK",
        count: todos.length,
        data: todos,
      });
    } catch (e: any) {
      log.push({ name: "Test Failed", status: "ERR", error: e.message });
    } finally {
      setResults(log);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>API Diagnostics</Text>
        <TouchableOpacity onPress={runTests} disabled={loading}>
          <Ionicons
            name="play"
            size={24}
            color={loading ? COLORS.textMuted : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && (
          <ActivityIndicator
            color={COLORS.primary}
            style={{ marginBottom: 20 }}
          />
        )}

        {results.length === 0 && (
          <Text style={styles.placeholder}>
            Tap the play icon to verify all API connections and data integrity.
          </Text>
        )}

        {results.map((res, i) => (
          <View key={i} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logName}>{res.name}</Text>
              <Text
                style={[
                  styles.logStatus,
                  {
                    color: res.status === "OK" ? COLORS.success : COLORS.danger,
                  },
                ]}
              >
                {res.status}
              </Text>
            </View>
            <Text style={styles.logJson}>
              {JSON.stringify(res.data || res.error || "No Details", null, 2)}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  title: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  scroll: { padding: 24 },
  placeholder: { color: COLORS.textMuted, textAlign: "center", marginTop: 100 },
  logCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  logStatus: { fontWeight: "900", fontSize: 12 },
  logJson: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
  },
});
