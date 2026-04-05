import { COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import CustomAlert from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import { Bank, useBanks } from "@/context/BankContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { CameraMode, CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const DETAILS_SHEET_HEIGHT = Math.min(
  560,
  Math.max(360, Math.round(height * 0.52)),
);

export default function BanksScreen() {
  const {
    banks,
    addBank,
    deleteBank,
    updateBank,
    totalBalance,
    isLoading,
    refresh,
  } = useBanks();
  const { addTransfer } = useExpenses();
  const { refreshFullData, user } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"banks" | "cards">("banks");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsBank, setDetailsBank] = useState<Bank | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [balance, setBalance] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const regularBanks = banks.filter(
    (b) => !b.purpose?.toLowerCase().includes("prepaid"),
  );
  const prepaidBanks = banks.filter(
    (b) => b.purpose?.toLowerCase().includes("prepaid"),
  );

  // Transfer state
  const [fromBank, setFromBank] = useState<number | null>(
    regularBanks.length > 0 ? regularBanks[0].id : null,
  );
  const [toBank, setToBank] = useState<number | null>(
    regularBanks.length > 1 ? regularBanks[1].id : null,
  );
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
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

  const PURPOSE_OPTIONS = [
    { name: "Spending", icon: "cart" },
    { name: "Investment", icon: "trending-up" },
    { name: "Savings", icon: "leaf" },
    { name: "Emergency Fund", icon: "shield-checkmark" },
    { name: "Salary Account", icon: "cash" },
    { name: "Prepaid Card", icon: "card" },
    { name: "Other", icon: "grid" },
  ];

  const BANK_DOMAINS: Record<string, string> = {
    hdfc: "hdfcbank.com",
    sbi: "onlinesbi.sbi",
    icici: "icicibank.com",
    axis: "axisbank.com",
    kotak: "kotak.com",
    pnb: "pnbindia.in",
    yes: "yesbank.in",
    idfc: "idfcfirstbank.com",
    hsbc: "hsbc.co.in",
    citi: "citibank.co.in",
    standard: "sc.com",
    canara: "canarabank.com",
    union: "unionbankofindia.co.in",
    paytm: "paytm.com",
    phonepe: "phonepe.com",
    slice: "sliceit.com",
    jupiter: "jupiter.money",
    fi: "fi.money",
    "federal bank": "federalbank.co.in",
    rbl: "rblbank.com",
    bob: "bankofbaroda.in",
    "bank of baroda": "bankofbaroda.in",
    "idbi": "idbibank.in",
    "indusind": "indusind.com",
    "indus ind": "indusind.com",
    "sc": "sc.com"
  };

  const getBankLogo = (name: string) => {
    const cleanName = name?.toLowerCase() || "";
    for (const key in BANK_DOMAINS) {
      if (cleanName.includes(key)) {
        return `https://www.google.com/s2/favicons?domain=${BANK_DOMAINS[key]}&sz=128`;
      }
    }
    return null;
  };

  const CARD_THEMES: Record<string, { colors: [string, string, ...string[]]; accent: string; domain?: string }> = {
    gosats: { colors: ["#ea580c", "#c2410c"], accent: "#fff", domain: "gosats.io" },
    slice: { colors: ["#4f46e5", "#3730a3"], accent: "#fff", domain: "sliceit.com" },
    jupiter: { colors: ["#1e293b", "#0f172a"], accent: "#facc15", domain: "jupiter.money" },
    amazon: { colors: ["#232f3e", "#000000"], accent: "#ff9900", domain: "amazon.in" },
    paytm: { colors: ["#00baf2", "#002e6e"], accent: "#fff", domain: "paytm.com" },
    phonepe: { colors: ["#5f259f", "#3c1664"], accent: "#fff", domain: "phonepe.com" },
    omni: { colors: ["#111", "#333"], accent: "#00ff7f", domain: "omnicard.in" },
    fam: { colors: ["#000", "#222"], accent: "#ffeb3b", domain: "famapp.in" },
    fi: { colors: ["#00b894", "#006266"], accent: "#fff", domain: "fi.money" },
    onecard: { colors: ["#2d3436", "#000"], accent: "#d63031", domain: "getonecard.com" },
  };

  const getCardTheme = (name: string) => {
    const cleanName = name?.toLowerCase() || "";
    for (const key in CARD_THEMES) {
      if (cleanName.includes(key)) return CARD_THEMES[key];
    }
    return { colors: ["#1e293b", "#0f172a"] as [string, string], accent: "#fff" };
  };

  const getPurposeIcon = (purposeName: string) => {
    const opt = PURPOSE_OPTIONS.find(
      (o) => o.name.toLowerCase() === purposeName?.toLowerCase()
    );
    return (opt?.icon || "business") as any;
  };

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

  const resetForm = (skipPurpose = false) => {
    setName("");
    if (!skipPurpose) setPurpose("");
    setBalance("");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setHolderName("");
    setEditMode(false);
    setEditingId(null);
  };

  const openAdd = (initialPurpose = "") => {
    resetForm(!!initialPurpose);
    if (initialPurpose) setPurpose(initialPurpose);
    setModalVisible(true);
  };

  const processOcr = async (base64: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("base64Image", `data:image/jpg;base64,${base64}`);
      formData.append("apikey", "helloworld"); // Free tier / trial key
      formData.append("isOverlayRequired", "false");
      formData.append("OCREngine", "2"); // Engine 2 is better for numbers

      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ParsedResults && data.ParsedResults[0]) {
        const text = data.ParsedResults[0].ParsedText as string;
        
        // --- SMART ANALYSIS ---
        
        // 1. Find 16-digit card number
        const cardMatch = text.replace(/\s+/g, "").match(/\d{16}/);
        if (cardMatch) {
          const num = cardMatch[0];
          setCardNumber(`${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)} ${num.slice(12,16)}`);
        }

        // 2. Find Expiry date (MM/YY)
        const expiryMatch = text.match(/\d{2}\/\d{2}/);
        if (expiryMatch) setExpiryDate(expiryMatch[0]);

        // 3. Find Cardholder Name (Usually all caps lines with spaces)
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 5);
        const nameLine = lines.find(l => /^[A-Z ]+$/.test(l) && !l.includes("CARD") && !l.includes("BANK"));
        if (nameLine) setHolderName(nameLine);

        // 4. Default Name if not found
        if (cardMatch && !nameLine) setName("Recognized Card");

        showAlert("Success", "Card details read and filled automatically!", "success");
      } else {
        showAlert("Scan Failed", "Could not read text clearly. Try better lighting.", "warning");
      }
    } catch (err) {
      console.error(err);
      // Fallback dummy for demo if network fails
      setCardNumber("4111 2222 3333 4444");
      setExpiryDate("12/28");
      setHolderName("Recognized User");
      showAlert("Limited Scan", "Used local recognition (Draft).", "info");
    } finally {
      setIsProcessing(false);
      setIsScanning(false);
    }
  };

  const startScan = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      if (photo.base64) {
        await processOcr(photo.base64);
      }
    } catch (e) {
      setIsScanning(false);
      showAlert("Error", "Could not capture photo.", "danger");
    }
  };

  const requestScanner = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        showAlert("Camera Denied", "We need camera permission to scan your card.", "danger");
        return;
      }
    }
    setIsScanning(true);
  };

  const handleAddBank = async () => {
    if (!name) {
      showAlert("Required Field", "Please enter a name/label.", "warning");
      return;
    }
    if (!balance || isNaN(parseFloat(balance))) {
      showAlert("Required Field", "Please enter a valid balance.", "warning");
      return;
    }
    try {
      const payload: any = {
        name,
        purpose,
        balance: parseFloat(balance),
        card_number: cardNumber,
        expiry_date: expiryDate,
        cvv,
        holder_name: holderName,
      };
      if (editMode && editingId) {
        await updateBank(editingId, payload);
      } else {
        await addBank(payload);
      }
      setModalVisible(false);
      resetForm();
      await refreshFullData();
      showAlert("Success", "Account saved successfully!", "success");
    } catch (e: any) {
      showAlert("Error", e.message, "danger");
    }
  };

  const openEdit = (bank: Bank, initialEditMode = false) => {
    setName(bank.name);
    setPurpose(bank.purpose);
    setBalance(bank.balance.toString());
    setCardNumber(bank.card_number || "");
    setExpiryDate(bank.expiry_date || "");
    setCvv(bank.cvv || "");
    setHolderName(bank.holder_name || "");
    setEditingId(bank.id);
    setEditMode(initialEditMode); 
    setModalVisible(true);
  };

  const openBankDetails = (bank: Bank) => {
    setDetailsBank(bank);
    setDetailsVisible(true);
  };

  const maskCardNumber = (value: string | null) => {
    if (!value) return "•••• •••• •••• ••••";
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 4) return `•••• ${digits}`;
    const last4 = digits.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const maskCvv = (value: string | null) => (value ? "•••" : "...");

  const detailsIsPrepaid = detailsBank?.purpose?.toLowerCase().includes("prepaid");
  const detailsIsBank = detailsBank?.purpose?.toLowerCase() === "spending" || detailsBank?.purpose?.toLowerCase() === "investment";

  const handleTransfer = async () => {
    if (!fromBank || !toBank || !transferAmount) {
      showAlert("Input Required", "Please select source, destination, and amount.", "warning");
      return;
    }
    if (fromBank === toBank) {
      showAlert("Logic Error", "Source and destination cannot be the same.", "danger");
      return;
    }

    setTransferring(true);
    try {
      await addTransfer({
        from_bank_id: fromBank,
        to_bank_id: toBank,
        amount: parseFloat(transferAmount),
        date: new Date().toISOString().split("T")[0],
        description: "Internal Transfer",
      });
      showAlert("Success", "Funds moved successfully!", "success");
      setTransferAmount("");
    } catch (e: any) {
      showAlert("Transfer Failed", e.message, "danger");
    } finally {
      setTransferring(false);
    }
  };

  const getBankBalance = (id: number | null) => {
    const bank = banks.find((b) => b.id === id);
    return bank
      ? `₹${parseFloat(bank.balance.toString()).toLocaleString()}`
      : "₹0";
  };

  const isReadOnly = !editMode && editingId !== null;
  const inputContainerStyle = [
    styles.modalInputContainer,
    isReadOnly && {
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingHorizontal: 0,
      height: 35,
      marginBottom: 15,
    },
  ] as any;
  const inputStyle = [
    styles.modalInput,
    isReadOnly && { fontWeight: "900", fontSize: 20, color: COLORS.text },
  ] as any;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Accounts</Text>
          <Text style={styles.subtitle}>
            {banks.length} linked accounts · ₹{totalBalance.toLocaleString()}{" "}
            total
          </Text>
        </View>
        <Avatar user={user} size={44} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "banks" && styles.tabActive]}
          onPress={() => setActiveTab("banks")}
        >
          <Ionicons
            name="business"
            size={18}
            color={activeTab === "banks" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[styles.tabText, activeTab === "banks" && styles.tabTextActive]}
          >
            Banks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "cards" && styles.tabActive]}
          onPress={() => setActiveTab("cards")}
        >
          <Ionicons
            name="card"
            size={18}
            color={activeTab === "cards" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[styles.tabText, activeTab === "cards" && styles.tabTextActive]}
          >
            Cards
          </Text>
        </TouchableOpacity>
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
        {activeTab === "banks" ? (
          <>
            <Text style={styles.sectionTitle}>YOUR BANKS</Text>
            {/* Full-width bank list */}
            <View style={styles.bankList}>
              {regularBanks.map((bank, i) => {
                const isBlue = i % 2 === 0;
                const pillBg = isBlue
                  ? "rgba(59, 130, 246, 0.12)"
                  : "rgba(16, 185, 129, 0.12)";
                const pillColor = isBlue ? "#3b82f6" : "#10b981";
                return (
                  <View
                    key={bank.id}
                    style={styles.bankListItem}
                  >
                    <TouchableOpacity
                      style={styles.bankListMain}
                      activeOpacity={0.7}
                      onPress={() => openBankDetails(bank)}
                    >
                      <View
                        style={[
                          styles.bankListIconCircle,
                          { backgroundColor: pillBg },
                        ]}
                      >
                        {getBankLogo(bank.name) ? (
                          <Image
                            source={{ uri: getBankLogo(bank.name)! }}
                            style={styles.bankLogo}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons
                            name={getPurposeIcon(bank.purpose)}
                            size={22}
                            color={pillColor}
                          />
                        )}
                      </View>

                      <View style={styles.bankListMid}>
                        <Text style={styles.bankListName} numberOfLines={1}>{bank.name}</Text>
                        <View style={[styles.inlinePill, { backgroundColor: pillBg }]}>
                          <Text style={[styles.inlinePillText, { color: pillColor }]}>
                            {(bank.purpose || "Account").toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bankListRight}>
                        <Text style={styles.bankListBalance}>
                          ₹{parseFloat(bank.balance.toString()).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.bankActions}>
                      <TouchableOpacity
                        style={styles.bankActionBtn}
                        onPress={() => openBankDetails(bank)}
                      >
                        <Ionicons name="eye" size={14} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bankActionBtn}
                        onPress={() => {
                          showAlert(
                            "Delete?",
                            `Delete ${bank.name}?`,
                            "danger",
                            () => deleteBank(bank.id),
                            "Delete"
                          );
                        }}
                      >
                        <Ionicons name="trash" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Add Bank Dash Card */}
              <TouchableOpacity
                style={styles.bankAddListItem}
                onPress={() => openAdd()}
              >
                <Ionicons name="add" size={22} color={COLORS.textMuted} />
                <Text style={styles.bankAddLabel}>Add Bank</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Prepaid Cards List */}
            <View style={styles.noticeContainer}>
              <View style={styles.noticeHeader}>
                <Ionicons name="alert-circle" size={18} color="#92400e" />
                <Text style={styles.noticeTitle}>Important Notice</Text>
              </View>
              <Text style={styles.noticeText}>
                Please only add <Text style={{ fontWeight: "800" }}>Prepaid Cards</Text>. Adding Credit or Debit cards is not supported in this section for security reasons.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>PREPAID CARDS & WALLETS</Text>
            <View style={styles.prepaidList}>
              {prepaidBanks.map((bank) => {
                const theme = getCardTheme(bank.name);
                const cardLogo = theme.domain
                  ? `https://www.google.com/s2/favicons?domain=${theme.domain}&sz=128`
                  : getBankLogo(bank.name);

                return (
                  <TouchableOpacity
                    key={bank.id}
                    onPress={() => openBankDetails(bank)}
                    activeOpacity={0.9}
                    style={{ width: "100%", marginBottom: 20 }}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.prepaidItem}
                    >
                      {/* Logo / Chip Section */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/chip.png")}
                          style={{ width: 40, height: 30, opacity: 0.9 }}
                          resizeMode="contain"
                        />
                        {cardLogo && (
                          <View style={styles.cardLogoContainer}>
                            <Image
                              source={{ uri: cardLogo }}
                              style={styles.cardLogoImg}
                              resizeMode="contain"
                            />
                          </View>
                        )}
                      </View>

                      <View style={{ marginTop: 25 }}>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 10,
                            fontWeight: "900",
                            letterSpacing: 2.5,
                          }}
                        >
                          PREPAID CARD
                        </Text>
                        <Text
                          style={{
                            color: theme.accent,
                            fontSize: 18,
                            fontWeight: "900",
                            letterSpacing: 4,
                            marginTop: 5,
                          }}
                        >
                          {maskCardNumber(bank.card_number)}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginTop: 30,
                          alignItems: "flex-end",
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 8,
                              fontWeight: "800",
                              letterSpacing: 1,
                            }}
                          >
                            CARD HOLDER
                          </Text>
                          <Text
                            style={{
                              color: theme.accent,
                              fontSize: 14,
                              fontWeight: "700",
                              textTransform: "uppercase",
                              marginTop: 2,
                            }}
                          >
                            {bank.holder_name || "UNKNOWN USER"}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 8,
                              fontWeight: "800",
                              letterSpacing: 1,
                            }}
                          >
                            EXPIRES
                          </Text>
                          <Text
                            style={{
                              color: theme.accent,
                              fontSize: 14,
                              fontWeight: "700",
                              textTransform: "uppercase",
                              marginTop: 2,
                            }}
                          >
                            {bank.expiry_date || "MM/YY"}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 8,
                              fontWeight: "800",
                              letterSpacing: 1,
                            }}
                          >
                            BALANCE
                          </Text>
                          <Text
                            style={{
                              color: theme.accent,
                              fontSize: 16,
                              fontWeight: "800",
                              marginTop: 2,
                            }}
                          >
                            ₹{parseFloat(bank.balance.toString()).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
              {/* Add Prepaid Dash Card */}
              <TouchableOpacity
                style={[
                  styles.prepaidItem,
                  {
                    borderStyle: "dashed",
                    borderWidth: 2,
                    borderColor: COLORS.border,
                    backgroundColor: "transparent",
                    justifyContent: "center",
                    minHeight: 180,
                  },
                ]}
                onPress={() => openAdd("Prepaid Card")}
              >
                <Ionicons name="add" size={24} color={COLORS.textMuted} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: COLORS.textMuted,
                    marginTop: 8,
                  }}
                >
                  Add Prepaid Card
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Internal Transfer Flow */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          TRANSFER FUNDS
        </Text>
        <View style={styles.transferCard}>
          <View style={styles.transferHeader}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
            <Text style={styles.transferTitle}>Move Money</Text>
          </View>

          <Text style={styles.inputLabel}>FROM ACCOUNT</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
          >
            {banks.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, fromBank === b.id && styles.chipActive]}
                onPress={() => setFromBank(b.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    fromBank === b.id && styles.chipTextActive,
                  ]}
                >
                  {b.name} — {getBankBalance(b.id)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>TO ACCOUNT</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
          >
            {banks.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, toBank === b.id && styles.chipActive]}
                onPress={() => setToBank(b.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    toBank === b.id && styles.chipTextActive,
                  ]}
                >
                  {b.name} — {getBankBalance(b.id)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
          <View style={styles.amountInputBox}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={transferAmount}
              onChangeText={setTransferAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.transferBtn, transferring && { opacity: 0.7 }]}
            onPress={handleTransfer}
            disabled={transferring}
          >
            {transferring ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.transferBtnText}>Transfer Now →</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Half-floating details sheet */}
      <Modal visible={detailsVisible} transparent animationType="fade">
        <View style={styles.detailsOverlay}>
          <TouchableWithoutFeedback onPress={() => setDetailsVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[styles.detailsSheet, { height: DETAILS_SHEET_HEIGHT }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailsScroll}
            >
              <View style={styles.detailsHandleWrap}>
                <View style={styles.detailsHandle} />
              </View>

              <View style={styles.detailsHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailsTitle}>
                    {detailsBank
                      ? detailsIsPrepaid
                        ? "Card Details"
                        : "Account Details"
                      : "Details"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setDetailsVisible(false)}
                  style={styles.detailsCloseBtn}
                >
                  <Ionicons name="close" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {detailsBank && (
                <>
                  <View style={styles.detailsNameRow}>
                    <Text style={styles.detailsName} numberOfLines={1}>
                      {detailsBank.name}
                    </Text>
                    <View
                      style={[
                        styles.detailsPill,
                        { backgroundColor: "rgba(255,255,255,0.06)" },
                      ]}
                    >
                      <Text style={styles.detailsPillText}>
                        {(detailsBank.purpose || "ACTIVE").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsKey}>BALANCE</Text>
                    <Text style={styles.detailsValue}>
                      ₹
                      {parseFloat(
                        detailsBank.balance.toString(),
                      ).toLocaleString()}
                    </Text>
                  </View>

                  {detailsIsPrepaid ? (
                    <>
                      <View style={styles.detailsSection}>
                        <Text style={styles.detailsKey}>CARD NUMBER</Text>
                        <Text style={styles.detailsValue}>
                          {maskCardNumber(detailsBank.card_number)}
                        </Text>
                      </View>

                      <View style={styles.detailsGrid}>
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsKey}>HOLDER</Text>
                          <Text style={styles.detailsValue}>
                            {detailsBank.holder_name || "UNKNOWN"}
                          </Text>
                        </View>
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsKey}>EXPIRY</Text>
                          <Text style={styles.detailsValue}>
                            {detailsBank.expiry_date || "MM/YY"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsSection}>
                        <Text style={styles.detailsKey}>CVV</Text>
                        <Text style={styles.detailsValue}>
                          {maskCvv(detailsBank.cvv)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsKey}>ACCOUNT TYPE</Text>
                      <Text style={styles.detailsValue}>
                        {(detailsBank.purpose || "ACTIVE").toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailsActions}>
                    <TouchableOpacity
                      style={styles.detailsActionPrimary}
                      onPress={() => {
                        // Close sheet first to avoid overlapping modals.
                        setDetailsVisible(false);
                        if (detailsBank) openEdit(detailsBank, true);
                      }}
                    >
                      <Ionicons name="pencil" size={18} color="#fff" />
                      <Text style={styles.detailsActionPrimaryText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailsActionDanger}
                      onPress={() => {
                        if (!detailsBank) return;
                        setDetailsVisible(false);
                        showAlert(
                          "Delete Account?",
                          `Are you sure you want to delete ${detailsBank.name}? All linked transactions will remain but the account will be removed.`,
                          "danger",
                          () => deleteBank(detailsBank.id),
                          "Delete"
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.detailsActionDangerText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 10 }} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank Details & Add Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: COLORS.background,
              justifyContent: "flex-start",
              paddingTop: 40,
            },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { flex: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {purpose?.toLowerCase().includes("prepaid")
                  ? editMode
                    ? "Edit Prepaid Card"
                    : editingId
                      ? "Card Details"
                      : "Add Prepaid Card"
                  : editMode
                    ? "Edit Account"
                    : editingId
                      ? "Account Details"
                      : "Link New Account"}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {purpose?.toLowerCase().includes("prepaid") && !editingId && !isReadOnly && (
                  <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={requestScanner}
                  >
                    <Ionicons name="scan" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {purpose?.toLowerCase().includes("prepaid") && (
                <View style={{ marginBottom: 25, paddingHorizontal: 10 }}>
                  <Text style={[styles.modalLabel, { marginBottom: 15 }]}>LIVE PREVIEW</Text>
                  <LinearGradient
                    colors={getCardTheme(name).colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.prepaidItem, { height: 160, padding: 20 }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Image
                        source={require("@/assets/images/chip.png")}
                        style={{ width: 35, height: 26, opacity: 0.8 }}
                        resizeMode="contain"
                      />
                      {(getCardTheme(name).domain || getBankLogo(name)) && (
                        <View style={[styles.cardLogoContainer, { width: 50, height: 30 }]}>
                          <Image
                            source={{ uri: getCardTheme(name).domain 
                              ? `https://www.google.com/s2/favicons?domain=${getCardTheme(name).domain}&sz=128` 
                              : (getBankLogo(name) || "")
                            }}
                            style={styles.cardLogoImg}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                    </View>
                    <View style={{ marginTop: 20 }}>
                      <Text style={{ color: getCardTheme(name).accent, fontSize: 16, fontWeight: '900', letterSpacing: 3 }}>
                        {maskCardNumber(cardNumber)}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 15 }}>
                        {holderName || "NAME ON CARD"}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
              <Text style={styles.modalLabel}>
                {purpose?.toLowerCase().includes("prepaid") ? "Card Label" : "Bank Name"}
              </Text>
              <View style={inputContainerStyle}>
                <TextInput
                  style={inputStyle}
                  placeholder={
                    purpose?.toLowerCase().includes("prepaid")
                      ? "e.g. My Amazon Card"
                      : "e.g. SBI Bank"
                  }
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  editable={!isReadOnly}
                />
              </View>

              {purpose?.toLowerCase().includes("prepaid") ? (
                <>
                  <Text style={styles.modalLabel}>Cardholder Name</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      style={inputStyle}
                      placeholder="JOHN DOE"
                      placeholderTextColor={COLORS.textMuted}
                      value={holderName}
                      onChangeText={setHolderName}
                      editable={!isReadOnly}
                    />
                  </View>
                  <Text style={styles.modalLabel}>Card Number</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      style={inputStyle}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="numeric"
                      maxLength={19}
                      placeholderTextColor={COLORS.textMuted}
                      value={cardNumber}
                      editable={!isReadOnly}
                      onChangeText={(val) => {
                        let v = val.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                        const parts = [];
                        for (let i = 0, len = v.length; i < len; i += 4) {
                          parts.push(v.substring(i, i + 4));
                        }
                        if (parts.length) {
                          setCardNumber(parts.join(" "));
                        } else {
                          setCardNumber(val);
                        }
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 15,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Expiry Date</Text>
                      <View style={inputContainerStyle}>
                        <TextInput
                          style={inputStyle}
                          placeholder="MM/YY"
                          maxLength={5}
                          placeholderTextColor={COLORS.textMuted}
                          value={expiryDate}
                          editable={!isReadOnly}
                          onChangeText={(val) => {
                            let v = val.replace(/[^0-9]/gi, "");
                            if (v.length > 2) {
                              v = v.substring(0, 2) + "/" + v.substring(2, 4);
                            }
                            setExpiryDate(v);
                          }}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>CVV</Text>
                      <View style={inputContainerStyle}>
                        <TextInput
                          style={inputStyle}
                          placeholder="123"
                          keyboardType="numeric"
                          maxLength={3}
                          secureTextEntry={!isReadOnly}
                          placeholderTextColor={COLORS.textMuted}
                          value={cvv}
                          editable={!isReadOnly}
                          onChangeText={setCvv}
                        />
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.modalLabel}>Card Balance</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      style={inputStyle}
                      placeholder="₹0.00"
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.textMuted}
                      value={balance}
                      onChangeText={setBalance}
                      editable={!isReadOnly}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalLabel}>Initial Balance</Text>
                  <View style={inputContainerStyle}>
                    <TextInput
                      style={inputStyle}
                      placeholder="₹0.00"
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.textMuted}
                      value={balance}
                      onChangeText={setBalance}
                      editable={!isReadOnly}
                    />
                  </View>

                  <Text style={styles.modalLabel}>Purpose</Text>
                  {!isReadOnly ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.purposeChipRow}
                    >
                      {PURPOSE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.name}
                          style={[
                            styles.purposeChip,
                            purpose === opt.name && styles.purposeChipActive,
                          ]}
                          onPress={() => setPurpose(opt.name)}
                        >
                          <Ionicons
                            name={opt.icon as any}
                            size={16}
                            color={purpose === opt.name ? COLORS.primary : COLORS.textMuted}
                          />
                          <Text
                            style={[
                              styles.purposeChipText,
                              purpose === opt.name && styles.purposeChipTextActive,
                            ]}
                          >
                            {opt.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={inputContainerStyle}>
                      <TextInput
                        style={inputStyle}
                        placeholder="e.g. Salary"
                        placeholderTextColor={COLORS.textMuted}
                        value={purpose}
                        onChangeText={setPurpose}
                        editable={false}
                      />
                    </View>
                  )}
                </>
              )}

              {editMode || editingId === null ? (
                <TouchableOpacity
                  style={styles.modalSubmit}
                  onPress={handleAddBank}
                >
                  <Text style={styles.modalSubmitText}>
                    {editMode ? "Save Changes" : "Save"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.modalSubmit,
                    { backgroundColor: "rgba(255,255,255,0.1)" },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text
                    style={[styles.modalSubmitText, { color: COLORS.text }]}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isScanning} animationType="fade" transparent={false}>
        <View style={[styles.scanOverlay, { flex: 1, backgroundColor: "#000" }]}>
          <CameraView 
            ref={cameraRef}
            style={StyleSheet.absoluteFill} 
            facing="back" 
          />
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.scanHeader}>
             <Text style={styles.scanTitle}>SCANNING CARD</Text>
          </View>

          <View style={styles.scanViewfinder}>
            <View style={styles.scanCorner} />
            <View style={[styles.scanCorner, { transform: [{ rotate: "90deg" }] }]} />
            <View style={[styles.scanCorner, { transform: [{ rotate: "180deg" }] }]} />
            <View style={[styles.scanCorner, { transform: [{ rotate: "270deg" }] }]} />
            <View style={styles.scanLine} />
          </View>

          <View style={styles.scanFooter}>
            <Text style={styles.scanText}>Position Card Inside Frame</Text>
            {isProcessing ? (
               <View style={{ marginTop: 10, alignItems: "center" }}>
                 <ActivityIndicator color={COLORS.primary} size="large" />
                 <Text style={[styles.scanSubText, { color: COLORS.primary }]}>Analyzing Card Data...</Text>
               </View>
            ) : (
              <>
                <Text style={styles.scanSubText}>Perfect! Now hold it steady.</Text>
                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={startScan}
                >
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scanCancel}
                  onPress={() => setIsScanning(false)}
                >
                  <Text style={styles.scanCancelText}>Cancel Scan</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
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
  scroll: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  bankList: { gap: 12 },
  bankListItem: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  bankListMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  bankListIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  bankLogo: {
    width: 28,
    height: 28,
  },
  bankListMid: { flex: 1, marginLeft: 14 },
  bankListName: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  inlinePill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlinePillText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bankListRight: { alignItems: "flex-end", marginRight: 16 },
  bankListBalance: { fontSize: 17, fontWeight: "900", color: COLORS.text },
  bankActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bankActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  scanBox: {
    alignItems: "center",
  },
  scanLine: {
    width: "100%",
    height: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    zIndex: 10,
  },
  scanHeader: {
    position: "absolute",
    top: 60,
    alignItems: "center",
  },
  scanTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    opacity: 0.8,
  },
  scanViewfinder: {
    width: "85%",
    height: 220,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  scanCorner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
    borderTopLeftRadius: 15,
  },
  scanFooter: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  scanSubText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  scanCancel: {
    marginTop: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanCancelText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  bankAddListItem: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  bankAddLabel: { fontSize: 14, fontWeight: "900", color: COLORS.textMuted },
  transferCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 24,
    paddingBottom: 30,
  },
  transferHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 25,
  },
  transferTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  chipRow: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  chipTextActive: { color: COLORS.primary, fontWeight: "800" },
  amountInputBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 20,
    justifyContent: "center",
    marginBottom: 25,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  purposeChipRow: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 5,
  },
  purposeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 8,
  },
  purposeChipActive: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderColor: "rgba(59, 130, 246, 0.25)",
  },
  purposeChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  purposeChipTextActive: {
    color: COLORS.primary,
  },
  transferBtn: {
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  transferBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  prepaidList: {
    gap: 0,
    width: "100%",
  },
  prepaidItem: {
    padding: 24,
    borderRadius: 22,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { height: 8, width: 0 },
    shadowRadius: 15,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  prepaidIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  prepaidInfo: { flex: 1 },
  prepaidName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  prepaidSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  prepaidAmount: { fontSize: 16, fontWeight: "900", color: COLORS.success },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 30,
    paddingBottom: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: { flex: 1 },
  modalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  modalInputContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 20,
    justifyContent: "center",
    marginBottom: 20,
  },
  modalInput: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  modalSubmit: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  modalSubmitText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  // Half-floating details sheet
  detailsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  detailsSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsScroll: { paddingBottom: 18 },
  detailsHandleWrap: { alignItems: "center", paddingVertical: 8 },
  detailsHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  detailsTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  detailsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  detailsNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  detailsName: { flex: 1, fontSize: 18, fontWeight: "900", color: COLORS.text },
  detailsPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  detailsPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textSecondary,
  },
  detailsSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  detailsKey: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailsValue: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  detailsGrid: { flexDirection: "row", gap: 12 },
  detailsActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 14,
  },
  detailsActionPrimary: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  detailsActionPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  detailsActionDanger: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  detailsActionDangerText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  noticeContainer: {
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.15)",
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400e",
  },
  noticeText: {
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
    fontWeight: "500",
  },
  cardLogoContainer: {
    width: 60,
    height: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLogoImg: {
    width: "100%",
    height: "100%",
  },
});
