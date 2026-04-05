import { COLORS as THEME_COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { useTodos } from "@/context/TodoContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CustomAlert from "@/components/CustomAlert";

export default function TasksScreen() {
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo, refresh } =
    useTodos();
  const { user, logout } = useAuth();
  const { colors: COLORS, theme } = useTheme();
  const { banks } = useBanks();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: "info" | "success" | "danger" | "warning";
    onConfirm?: () => void;
    confirmText?: string;
  }>({
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "danger" | "warning" = "info",
    onConfirm?: () => void,
    confirmText?: string
  ) => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm: onConfirm
        ? () => {
            onConfirm();
            setAlertVisible(false);
          }
        : undefined,
      confirmText,
    });
    setAlertVisible(true);
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleTodo(id);
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to toggle task", "danger");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to delete task", "danger");
    }
  };

  const router = useRouter();

  const stats = useMemo(() => {
    const completed = todos.filter((t) => t.completed).length;
    const total = todos.length;
    const pending = total - completed;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdue = 0;
    let soon = 0;

    todos.forEach((t) => {
      const field = t.at || t.remind_at;
      if (!t.completed && field) {
        const d = new Date(field.toString().replace(" ", "T"));
        if (!isNaN(d.getTime())) {
          if (d < today) {
            overdue++;
          } else {
            const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            if (diff >= 0 && diff <= 3) {
              soon++;
            }
          }
        }
      }
    });

    return {
      total,
      completed,
      pending,
      overdue,
      soon,
    };
  }, [todos]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await addTodo(
        newTitle.trim(),
        newAmount ? parseFloat(newAmount) : undefined,
        newCategory,
        newDate ? newDate.toISOString() : undefined,
      );
      setModalVisible(false);
      setNewTitle("");
      setNewAmount("");
      setNewCategory("Other");
      setNewDate(null);
      showAlert("Task Created", "Your smart task has been added successfully.", "success");
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to add task", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = [
    { name: "Food & Dining", icon: "fast-food-outline" },
    { name: "Transportation", icon: "car-outline" },
    { name: "Shopping", icon: "cart-outline" },
    { name: "Entertainment", icon: "game-controller-outline" },
    { name: "Bills & Utilities", icon: "flash-outline" },
    { name: "Healthcare", icon: "medical-outline" },
    { name: "Education", icon: "book-outline" },
    { name: "Other", icon: "grid-outline" },
  ];

  const getCatIcon = (name: string) => {
    return CATEGORIES.find(c => c.name === name)?.icon || "grid-outline";
  };

  const renderTaskCard = ({ item }: { item: any }) => {
    const isDone = item.completed;
    const category = item.category || "Other";
    const amount = item.amount || 0;
    let dateStr = "No Date";
    
    // Check all possible date fields (at, remind_at, or even created_at as backup if user expects something)
    const rawDate = item.at || item.remind_at;
    
    if (rawDate) {
      try {
        const d = new Date(rawDate.toString().replace(" ", "T"));
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      } catch (e) {
        dateStr = rawDate.toString().substring(0, 10);
      }
    }

    const pColor = COLORS.primary;

    return (
      <View style={[styles.taskCard, isDone && styles.taskDone]}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: isDone ? COLORS.success : pColor },
          ]}
        />
        <View style={styles.taskInner}>
          <View style={styles.taskHeader}>
            <TouchableOpacity
              style={[styles.check, isDone && styles.checked]}
              onPress={() => handleToggle(item.id)}
            >
              {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
            <View style={styles.taskInfo}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={getCatIcon(category) as any} size={14} color={COLORS.textMuted} />
                <Text style={styles.taskSub}>{category}</Text>
              </View>
              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                {item.task}
              </Text>
            </View>
          </View>

          <View style={styles.taskFooter}>
            <View style={styles.badgeRow}>
              {!isDone ? (
                <>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>Due {dateStr}</Text>
                  </View>
                  {amount > 0 && (
                    <View style={styles.amtBadge}>
                      <Text style={styles.amtText}>₹{amount}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: COLORS.success + "15" },
                  ]}
                >
                  <View
                    style={[styles.pDot, { backgroundColor: COLORS.success }]}
                  />
                  <Text style={[styles.pText, { color: COLORS.success }]}>
                    Done
                  </Text>
                </View>
              )}
            </View>
            {!isDone && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() =>
                  router.push({
                    pathname: "/add",
                    params: {
                      title: item.task,
                      amount: amount.toString(),
                      taskId: item.id.toString(),
                    },
                  })
                }
              >
                <Text style={styles.payBtnText}>Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Smart To-Do</Text>
          <Text style={styles.subtitle}>
            {stats.total} total tasks
          </Text>
        </View>
        <Avatar user={user} size={44} />
      </View>

      {/* Summary Grid */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: COLORS.danger }]}>
            {stats.overdue}
          </Text>
          <Text style={styles.sumLabel}>OVERDUE</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: COLORS.warning }]}>
            {stats.soon}
          </Text>
          <Text style={styles.sumLabel}>DUE SOON</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: COLORS.success }]}>
            {stats.completed}
          </Text>
          <Text style={styles.sumLabel}>DONE</Text>
        </View>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTaskCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.addCardTop}
              onPress={() => setModalVisible(true)}
            >
              <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.addCardBlur}>
                <View style={styles.addCardInner}>
                  <View style={styles.addIconBox}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.addTitle}>Create New Smart Task</Text>
                    <Text style={styles.addSub}>Plan your bills & expenses</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </BlurView>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>PENDING TASKS</Text>
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <BlurView intensity={40} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.modalInner}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Smart Task</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Task / Bill Name</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Pay Electricity Bill"
                    placeholderTextColor={COLORS.textMuted}
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                </View>

                <Text style={[styles.label, { marginTop: 20 }]}>
                  Expected Amount (Optional)
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                  />
                </View>

                <Text style={[styles.label, { marginTop: 20 }]}>
                  Category (Optional)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.catRow}
                >
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.catChip,
                        newCategory === cat.name && styles.catChipActive,
                      ]}
                      onPress={() => setNewCategory(cat.name)}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={16} 
                        color={newCategory === cat.name ? COLORS.primary : COLORS.textMuted} 
                      />
                      <Text
                        style={[
                          styles.catText,
                          newCategory === cat.name && styles.catTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { marginTop: 20 }]}>
                  Remind Date (Optional)
                </Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.datePickerText}>
                    {newDate ? newDate.toDateString() : "Select a date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={newDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setNewDate(date);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={[styles.submit, submitting && { opacity: 0.7 }]}
                  onPress={handleAdd}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Create Task</Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  summaryGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  sumBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sumVal: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  sumLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 150 },
  addCardTop: {
    marginBottom: 25,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addCardBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingRight: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  addCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  addIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  addSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: "600" },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginBottom: 16,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accentBar: { width: 4 },
  taskInner: { flex: 1, padding: 18 },
  taskDone: { opacity: 0.4 },
  taskHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 15 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checked: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskInfo: { flex: 1, marginLeft: 16 },
  taskTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  taskTitleDone: { textDecorationLine: "line-through", color: COLORS.textMuted },
  taskSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pDot: { width: 6, height: 6, borderRadius: 3 },
  pText: { fontSize: 10, fontWeight: "800" },
  dateBadge: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dateText: { fontSize: 11, fontWeight: "800", color: COLORS.textSecondary },
  amtBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  amtText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  payBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  payBtnText: { color: COLORS.text, fontSize: 12, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalInner: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inputBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  input: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  catRow: { flexDirection: "row", marginBottom: 10 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catChipActive: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  catText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  catTextActive: { color: COLORS.primary },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
  },
  datePickerText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  submit: {
    backgroundColor: COLORS.primary,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
