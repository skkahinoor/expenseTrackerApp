import { COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { label: "FOOD", icon: "🍔", color: "#3b82f6" },
  { label: "SHOP", icon: "🛍️", color: "#ec4899" },
  { label: "TRAVEL", icon: "⛽", color: "#14b8a6" },
  { label: "RENT", icon: "🏠", color: "#ef4444" },
  { label: "HEALTH", icon: "💊", color: "#f59e0b" },
  { label: "FUN", icon: "🎬", color: "#a855f7" },
  { label: "EDU", icon: "📚", color: "#8b5cf6" },
  { label: "BILLS", icon: "⚡", color: "#f59e0b" },
];

export default function AddScreen() {
  const { addExpense } = useExpenses();
  const { banks } = useBanks();
  const { refreshFullData, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [selectedBank, setSelectedBank] = useState<number | null>(
    banks.length > 0 ? banks[0].id : null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.title) {
      setDescription(params.title as string);
      setCategory("BILLS");
    }
    if (params.amount) {
      setAmount(params.amount as string);
    }
  }, [params]);

  const handleKeyPress = (val: string) => {
    if (amount === "0") {
      setAmount(val);
    } else {
      setAmount(amount + val);
    }
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount("0");
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (amount === "0") {
      Alert.alert("Invalid Input", "Please enter an amount.");
      return;
    }
    if (!selectedBank) {
      Alert.alert("Source Missing", "Please select an account.");
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        description: description || category,
        category: category,
        bank_id: selectedBank,
        date: new Date().toISOString().split("T")[0],
        todo_id: params.taskId ? parseInt(params.taskId as string) : undefined,
      } as any);
      await refreshFullData();
      router.push("/");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 60 }]}>
        <View>
          <Text style={styles.title}>Add Expense</Text>
          <Text style={styles.subtitle}>Quick entry · near-zero friction</Text>
        </View>
        <Avatar user={user} size={44} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        <View style={styles.amountArea}>
          <Text style={styles.currency}>₹</Text>
          <Text style={styles.amountText}>{amount}</Text>
        </View>

        <Text style={styles.sectionTitle}>SELECT CATEGORY</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[
                styles.catTile,
                category === cat.label && styles.catTileActive,
              ]}
              onPress={() => setCategory(cat.label)}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text
                style={[
                  styles.catLabel,
                  category === cat.label && styles.catLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>PAY FROM ACCOUNT</Text>
          <TouchableOpacity style={styles.accountSelector} onPress={() => {}}>
            <Text style={styles.accountText}>
              {banks.find((b) => b.id === selectedBank)?.name ||
                "Select Account"}{" "}
              — ₹
              {parseFloat(
                banks.find((b) => b.id === selectedBank)?.balance?.toString() ||
                  "0",
              ).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.formLabel, { marginTop: 20 }]}>
            NOTE (OPTIONAL)
          </Text>
          <View style={styles.noteInputBox}>
            <Text style={styles.notePlaceholder}>
              {description || "What was this for?"}
            </Text>
          </View>
        </View>

        {/* Custom Keypad */}
        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleKeyPress(num.toString())}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.key}
            onPress={() => handleKeyPress(".")}
          >
            <Text style={styles.keyText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            onPress={() => handleKeyPress("0")}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.key, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
            onPress={handleBackspace}
          >
            <Ionicons
              name="backspace-outline"
              size={24}
              color={COLORS.danger}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Add Expense ✦</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
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
  amountArea: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  currency: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.textSecondary,
    marginRight: 10,
    marginTop: 10,
  },
  amountText: { fontSize: 72, fontWeight: "900", color: COLORS.text },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },
  catTile: {
    width: (width - 70) / 4,
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catTileActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  catEmoji: { fontSize: 24, marginBottom: 6 },
  catLabel: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted },
  catLabelActive: { color: COLORS.primary },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  accountSelector: {
    height: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  accountText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "700" },
  noteInputBox: {
    height: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  notePlaceholder: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  keypad: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 30 },
  key: {
    width: (width - 60) / 3,
    height: 64,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  submitBtn: {
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
