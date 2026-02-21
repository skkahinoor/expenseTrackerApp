import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CATEGORIES = [
  { label: "Food & Dining", icon: "fast-food-outline", color: "#f59e0b" },
  { label: "Transportation", icon: "car-outline", color: "#6366f1" },
  { label: "Shopping", icon: "cart-outline", color: "#ec4899" },
  { label: "Bills & Utilities", icon: "receipt-outline", color: "#ef4444" },
  { label: "Entertainment", icon: "game-controller-outline", color: "#8b5cf6" },
  { label: "Other", icon: "list-outline", color: "#10b981" },
];

export default function AddExpense() {
  const { addExpense } = useExpenses();
  const { user } = useAuth();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        description: description || category,
        category: category,
        bank_id: parseInt(user?.salary_bank_id || "1"), // Fallback to 1 if not set
        date: new Date().toISOString().split("T")[0],
      });
      Alert.alert("Success", "Expense added successfully", [
        { text: "OK", onPress: () => router.push("/") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Amount Input */}
          <View style={styles.amountWrapper}>
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#334155"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="create-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="What was this for?"
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.categoryCard,
                    category === item.label && {
                      backgroundColor: item.color + "22",
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => setCategory(item.label)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={category === item.label ? item.color : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === item.label && {
                        color: item.color,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save Expense</Text>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  amountWrapper: {
    alignItems: "center",
    marginVertical: 30,
  },
  amountLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: 40,
    fontWeight: "800",
    color: "#6366f1",
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: "800",
    color: "#f1f5f9",
    minWidth: 100,
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#334155",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: "#f1f5f9",
    fontSize: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#6366f1",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
