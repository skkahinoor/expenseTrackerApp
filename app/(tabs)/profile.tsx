import { COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import CustomAlert from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
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

export default function Profile() {
  const { user, logout, token, resetData, refreshUser } = useAuth();
  const { banks, updateBank, refresh: refreshBanks } = useBanks();
  const [loading, setLoading] = useState(false);
  
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
    setAlertConfig({ title, message, type, onConfirm, confirmText });
    setAlertVisible(true);
  };
  const { height } = Dimensions.get("window");
  const EDIT_SHEET_HEIGHT = Math.min(
    560,
    Math.max(360, Math.round(height * 0.5)),
  );

  const uInfo: any = user || {};
  const userPhone = uInfo.phone_number || "Add phone number";
  const userAddress = uInfo.address || "Add address";

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("profile_pic", {
        uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(
        `https://expensetrack.online/backend/public/api/user/profile-pic`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );

      if (res.ok) {
        if (refreshUser) await refreshUser();
        Alert.alert("Success", "Profile picture updated!");
      } else {
        Alert.alert("Error", "Failed to update profile picture.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const phoneValue = userPhone === "Add phone number" ? "" : userPhone;
  const addressValue = userAddress === "Add address" ? "" : userAddress;

  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    phone_number: phoneValue,
    address: addressValue,
  });

  const openEditSheet = () => {
    setEditForm({
      name: user?.name || "",
      phone_number: phoneValue,
      address: addressValue,
    });
    setEditSheetVisible(true);
  };

  const handleSaveProfile = async () => {
    if (editSaving) return;
    setEditSaving(true);
    try {
      const API_BASE = "https://expensetrack.online/backend/public/api";
      await fetch(`${API_BASE}/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(editForm),
      }).catch(() => {});
      if (refreshUser) await refreshUser();
      setEditSheetVisible(false);
      Alert.alert("Saved", "Profile details updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save profile.");
    } finally {
      setEditSaving(false);
    }
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>Profile </Text>
          </View>
          <Text style={styles.subtitle}>Account & preferences</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity style={styles.editBtn} onPress={openEditSheet}>
            <Ionicons name="pencil" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <Avatar user={user} size={44} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Identity Section */}
        <View style={styles.identity}>
          <Avatar user={user} size={120} onPress={pickImage}>
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </Avatar>
          <Text style={styles.userName}>{user?.name || "Aryan Sharma"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "aryan.sharma@gmail.com"}
          </Text>
        </View>

        {/* Profile Details */}
        <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>
        <View style={styles.frameworkCard}>
          <View style={styles.frameworkItem}>
            <View style={styles.iconBox}>
              <Ionicons name="person-circle" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Full Name</Text>
              <Text style={styles.itemSub}>{user?.name || "Sk Kahinoor"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.frameworkItem}>
            <View style={styles.iconBox}>
              <Ionicons name="call" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Phone Number</Text>
              <Text style={styles.itemSub}>{userPhone}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.frameworkItem}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Address</Text>
              <Text style={styles.itemSub}>{userAddress}</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>⚠ DANGER ZONE</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() =>
              showAlert(
                "Reset All Data?",
                "This will permanently erase all expenses, tasks, and reset all bank balances to zero. This action cannot be undone.",
                "danger",
                async () => {
                  try {
                    setLoading(true);
                    // 1. Reset Core Data (expenses/todos)
                    await resetData();
                    
                    // 2. Reset All Bank Balances to 0
                    const resetPromises = banks.map(bank => 
                      updateBank(bank.id, { balance: 0 })
                    );
                    await Promise.all(resetPromises);
                    
                    // 3. Refresh everything
                    if (refreshUser) await refreshUser();
                    await refreshBanks();
                    
                    showAlert("Reset Success", "Your account has been wiped clean.", "success");
                  } catch (e: any) {
                    showAlert("Error", e.message || "Failed to reset data", "danger");
                  } finally {
                    setLoading(false);
                  }
                },
                "Reset Everything"
              )
            }
          >
            <Text style={styles.resetBtnText}>Reset All Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.resetBtn,
              { marginTop: 10, borderColor: COLORS.border },
            ]}
            onPress={() => 
              showAlert(
                "Logout?",
                "Are you sure you want to sign out of your account?",
                "warning",
                logout,
                "Logout"
              )
            }
          >
            <Text
              style={[styles.resetBtnText, { color: COLORS.textSecondary }]}
            >
              Logout Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertVisible(false)}
      />
      {/* Half-floating edit sheet */}
      <Modal visible={editSheetVisible} transparent animationType="fade">
        <View style={styles.sheetOverlay}>
          <TouchableWithoutFeedback onPress={() => setEditSheetVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[styles.sheet, { height: EDIT_SHEET_HEIGHT }]}>
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setEditSheetVisible(false)}
              >
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
            >
              <Text style={styles.sheetLabel}>Full Name</Text>
              <View style={styles.sheetInputContainer}>
                <TextInput
                  style={styles.sheetInput}
                  value={editForm.name}
                  onChangeText={(val: string) =>
                    setEditForm({ ...editForm, name: val })
                  }
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <Text style={styles.sheetLabel}>Phone Number</Text>
              <View style={styles.sheetInputContainer}>
                <TextInput
                  style={styles.sheetInput}
                  keyboardType="phone-pad"
                  value={editForm.phone_number}
                  onChangeText={(val: string) =>
                    setEditForm({ ...editForm, phone_number: val })
                  }
                  placeholder="Add phone number"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <Text style={styles.sheetLabel}>Address</Text>
              <View style={styles.sheetInputContainer}>
                <TextInput
                  style={[styles.sheetInput, { minHeight: 84 }]}
                  value={editForm.address}
                  onChangeText={(val: string) =>
                    setEditForm({ ...editForm, address: val })
                  }
                  placeholder="Add address"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
              </View>

              <View style={{ height: 14 }} />

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetSecondaryBtn}
                  onPress={() => setEditSheetVisible(false)}
                >
                  <Text style={styles.sheetSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetPrimaryBtn}
                  onPress={handleSaveProfile}
                  disabled={editSaving}
                  activeOpacity={0.9}
                >
                  <Text style={styles.sheetPrimaryText}>
                    {editSaving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 6 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 20 },
  identity: { alignItems: "center", marginVertical: 30 },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
  avatarLabel: { fontSize: 36, fontWeight: "900", color: "#fff" },
  cameraOverlay: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  frameworkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frameworkItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 18 },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemLabel: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  itemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  itemValue: { fontSize: 15, fontWeight: "900", color: COLORS.primary },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginHorizontal: 15,
  },
  notifItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  dangerZone: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  dangerTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.danger,
    letterSpacing: 1,
    marginBottom: 20,
  },
  resetBtn: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  resetBtnText: { color: COLORS.danger, fontSize: 16, fontWeight: "800" },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandleWrap: { alignItems: "center", paddingVertical: 8 },
  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  sheetScroll: { paddingBottom: 18 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: "900", color: COLORS.text },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sheetInputContainer: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  sheetInput: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
  },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  sheetSecondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  sheetSecondaryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "900",
  },
  sheetPrimaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
