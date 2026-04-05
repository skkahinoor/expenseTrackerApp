import { COLORS as THEME_COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  { label: "OTHER", icon: "📦", color: "#64748b" },
];

const UPI_APPS = [
  { id: 'record', label: 'Just Record Entry', icon: '📝', scheme: null, localLogo: null },
  { id: 'gpay', label: 'Google Pay', icon: '🔵', scheme: 'tez://pay', localLogo: require('@/assets/images/upi/gpay.png') },
  { id: 'phonepe', label: 'PhonePe', icon: '🟣', scheme: 'phonepe://pay', localLogo: require('@/assets/images/upi/phonepe.png') },
  { id: 'paytm', label: 'Paytm', icon: '🔵', scheme: 'paytmmp://pay', localLogo: require('@/assets/images/upi/paytm.png') },
  { id: 'bhim', label: 'BHIM UPI', icon: '🟡', scheme: 'bhim://pay', localLogo: require('@/assets/images/upi/bhim.png') },
  { id: 'navi', label: 'Navi UPI', icon: '🟢', scheme: 'navi://pay', localLogo: require('@/assets/images/upi/navi.png') },
];

export default function AddScreen() {
  const { addExpense } = useExpenses();
  const { banks } = useBanks();
  const { refreshFullData, user } = useAuth();
  const { theme, colors: COLORS } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [upiApp, setUpiApp] = useState(UPI_APPS[0].id);
  const [sourceType, setSourceType] = useState<'bank' | 'card'>('bank');
  const [upiModalVisible, setUpiModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const hasSpecificParams = params.title || params.amount;
      
      if (hasSpecificParams) {
        if (params.title) setDescription(params.title as string);
        if (params.amount) setAmount(params.amount.toString());
        setCategory("BILLS");
      } else {
        setAmount("0");
        setDescription("");
        setCategory(CATEGORIES[0].label);
        setBankModalVisible(false);
        setUpiApp(UPI_APPS[0].id);
        setSourceType('bank');
      }
    }, [params.title, params.amount])
  );

  // Filtered lists for bank/card
  const filteredBanks = useMemo(() => {
    return banks.filter(b => {
      const p = b.purpose?.toLowerCase() || "";
      const n = b.name?.toLowerCase() || "";
      const isPrepaid = p.includes("prepaid") || n.includes("prepaid") || (b as any).account_type?.toLowerCase()?.includes("prepaid");
      return sourceType === 'card' ? isPrepaid : !isPrepaid;
    });
  }, [banks, sourceType]);

  useEffect(() => {
    if (filteredBanks.length > 0) {
      // Auto-set the first valid source if current selection is invalid for filtered list
      const currentExists = filteredBanks.some(b => b.id === selectedBank);
      if (!currentExists) {
        setSelectedBank(filteredBanks[0].id);
      }
    } else {
      // If no accounts found for this type, clear selection
      setSelectedBank(null);
    }
  }, [filteredBanks]);

  useEffect(() => {
    if (upiApp !== 'record') {
      setSourceType('bank'); // Force bank when UPI is selected
    }
  }, [upiApp]);

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
      
      const app = UPI_APPS.find(a => a.id === upiApp);
      if (app && app.scheme) {
        // Try the specific app first, fallback to universal upi://pay if it fails
        try {
          const supported = await Linking.canOpenURL(app.scheme);
          if (supported) {
            await Linking.openURL(app.scheme);
          } else {
            // Standard UPI chooser as fallback - works better in Expo Go
            await Linking.openURL('upi://pay').catch(() => {
              Alert.alert("Link error", `Could not find any UPI apps for ${app.label}.`);
            });
          }
        } catch (err) {
          // Fallback to universal UPI chooser anyway
          await Linking.openURL('upi://pay').catch(() => {});
        }
      }

      // Explicit reset after save
      setAmount("0");
      setDescription("");
      setCategory(CATEGORIES[0].label);
      
      router.push("/");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
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
          <TextInput
            style={styles.amountInput}
            value={amount === "0" ? "" : amount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9.]/g, "");
              const parts = cleaned.split(".");
              if (parts.length > 2) return; 
              setAmount(cleaned);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
            maxLength={10}
            onBlur={() => { if (amount === "" || amount === ".") setAmount("0"); }}
          />
        </View>

        <Text style={styles.sectionTitle}>PAY VIA UPI APP (OPTIONAL)</Text>
        <TouchableOpacity 
          style={styles.upiCard} 
          onPress={() => setUpiModalVisible(true)}
        >
          <View style={styles.upiInfo}>
            <View style={[styles.upiIcon, { backgroundColor: upiApp === 'record' ? 'rgba(0,0,0,0.05)' : COLORS.primary + '15' }]}>
              {UPI_APPS.find(a => a.id === upiApp)?.localLogo ? (
                <Image source={UPI_APPS.find(a => a.id === upiApp)?.localLogo} style={styles.upiLogo} />
              ) : (
                <Text style={{ fontSize: 18 }}>{UPI_APPS.find(a => a.id === upiApp)?.icon}</Text>
              )}
            </View>
            <Text style={styles.upiLabel}>
              {UPI_APPS.find(a => a.id === upiApp)?.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>SELECT CATEGORY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[
                styles.catCard,
                category === cat.label && styles.catCardActive,
              ]}
              onPress={() => setCategory(cat.label)}
            >
              <View style={[styles.catIconBg, { backgroundColor: cat.color + "15" }]}>
                <Text style={styles.catEmojiText}>{cat.icon}</Text>
              </View>
              <Text
                style={[
                  styles.catCardLabel,
                  category === cat.label && styles.catCardLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Text style={styles.formLabel}>PAY FROM ACCOUNT</Text>
            {/* Show Bank/Card toggle ONLY if upiApp is record */}
            {upiApp === 'record' && (
              <View style={styles.sourceToggle}>
                <TouchableOpacity 
                  onPress={() => setSourceType('bank')}
                  style={[styles.toggleBtn, sourceType === 'bank' && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleText, sourceType === 'bank' && styles.toggleTextActive]}>Bank</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setSourceType('card')}
                  style={[styles.toggleBtn, sourceType === 'card' && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleText, sourceType === 'card' && styles.toggleTextActive]}>Card</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.accountCard} 
            onPress={() => setBankModalVisible(true)}
          >
            <View style={styles.accountInfo}>
              <View style={[styles.accountIcon, { backgroundColor: sourceType === 'bank' ? COLORS.primary + '15' : COLORS.accent + '15' }]}>
                <Ionicons 
                  name={sourceType === 'bank' ? "business-outline" : "card-outline"} 
                  size={20} 
                  color={sourceType === 'bank' ? COLORS.primary : COLORS.accent} 
                />
              </View>
              <View>
                <Text style={styles.accountName}>
                  {banks.find((b) => b.id === selectedBank)?.name || "Select Account"}
                </Text>
                <Text style={styles.accountBalance}>
                  Balance: ₹{parseFloat(banks.find((b) => b.id === selectedBank)?.balance?.toString() || "0").toLocaleString()}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.formLabel, { marginTop: 24 }]}>
            NOTE (OPTIONAL)
          </Text>
          <View style={styles.noteContainer}>
            <TextInput
              style={styles.noteInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>
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

      {/* Bank Selector Modal */}
      <Modal visible={bankModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setBankModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose {sourceType === 'bank' ? 'Bank' : 'Card'}</Text>
                  <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.bankList}>
                  {filteredBanks.map((bank) => (
                    <TouchableOpacity
                      key={bank.id}
                      style={[
                        styles.bankItem,
                        selectedBank === bank.id && styles.bankItemActive
                      ]}
                      onPress={() => {
                        setSelectedBank(bank.id);
                        setBankModalVisible(false);
                      }}
                    >
                      <View style={styles.bankItemMain}>
                        <View style={[styles.bankIcon, { backgroundColor: (sourceType === 'bank' ? COLORS.primary : COLORS.accent) + '10' }]}>
                          <Ionicons 
                            name={sourceType === 'bank' ? "business" : "card"} 
                            size={20} 
                            color={sourceType === 'bank' ? COLORS.primary : COLORS.accent} 
                          />
                        </View>
                        <View>
                          <Text style={styles.bankItemName}>{bank.name}</Text>
                          <Text style={styles.bankItemBalance}>₹{parseFloat(bank.balance.toString()).toLocaleString()}</Text>
                        </View>
                      </View>
                      {selectedBank === bank.id && (
                        <Ionicons name="checkmark-circle" size={22} color={sourceType === 'bank' ? COLORS.primary : COLORS.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredBanks.length === 0 && (
                    <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginVertical: 40 }}>
                      No {sourceType}s added yet.
                    </Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* UPI Selector Modal */}
      <Modal visible={upiModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setUpiModalVisible(false)}>
          <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { borderRadius: 32, maxHeight: '80%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pay via App</Text>
                  <TouchableOpacity onPress={() => setUpiModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={{ gap: 10 }}>
                  {UPI_APPS.map((app) => (
                    <TouchableOpacity
                      key={app.id}
                      style={[
                        styles.upiItem,
                        upiApp === app.id && styles.upiItemActive
                      ]}
                      onPress={() => {
                        setUpiApp(app.id);
                        setUpiModalVisible(false);
                      }}
                    >
                      <View style={styles.upiItemLeft}>
                        <View style={styles.upiLogoContainer}>
                          {app.localLogo ? (
                            <Image source={app.localLogo} style={styles.upiLogoMini} />
                          ) : (
                            <Text style={{ fontSize: 20 }}>{app.icon}</Text>
                          )}
                        </View>
                        <Text style={[styles.upiItemLabel, upiApp === app.id && { color: COLORS.primary }]}>{app.label}</Text>
                      </View>
                      {upiApp === app.id && <Ionicons name="radio-button-on" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 50 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  amountArea: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  currency: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginRight: 12,
    marginTop: 8,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: "900",
    color: COLORS.text,
    minWidth: 100,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  catScroll: { marginBottom: 30, paddingLeft: 20 },
  catScrollContent: { paddingRight: 40, gap: 12 },
  catCard: {
    width: 90,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  catIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  catEmojiText: { fontSize: 24 },
  catCardLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  catCardLabelActive: { color: COLORS.primary },
  formCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  accountInfo: { flexDirection: "row", alignItems: "center", gap: 14 },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  accountBalance: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },
  noteContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  noteInput: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  submitBtn: {
    height: 64,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  bankList: { gap: 12 },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bankItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  bankItemMain: { flexDirection: "row", alignItems: "center", gap: 14 },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bankItemName: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  bankItemBalance: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontWeight: "600" },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.surface,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  upiInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  upiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  upiLogo: { width: '100%', height: '100%', resizeMode: 'contain' },
  upiLogoMini: { width: 32, height: 32, resizeMode: 'contain' },
  upiLogoContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiLabel: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  upiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 8,
  },
  upiItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  upiItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  upiItemLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
});
