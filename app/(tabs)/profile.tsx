import { COLORS } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import CustomAlert from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import { useBanks } from "@/context/BankContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useMemo } from "react";
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
  const { user, logout, token, resetData, refreshUser, updateProfile, uploadProfilePic } = useAuth();
  const { banks, updateBank, refresh: refreshBanks } = useBanks();
  const { theme, toggleTheme, colors: COLORS } = useTheme();
  const isDark = theme === "dark";
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

  const [imageSourceVisible, setImageSourceVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      showAlert("Permission Denied", "We need camera and gallery permissions to update your profile picture.", "warning");
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean = false) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setImageSourceVisible(false);

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
    }

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      
      // If the edit modal is NOT open, we upload immediately like before
      // But if it IS open, we'll save it when the user clicks 'Save Changes'
      if (!editSheetVisible) {
        uploadImage(uri);
      }
    }
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
      if (uploadProfilePic) {
        await uploadProfilePic(uri);
        showAlert("Success", "Profile picture updated successfully!", "success");
      }
    } catch (e: any) {
      console.error(e);
      showAlert("Error", e.message || "Failed to update profile picture.", "danger");
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
      // 1. Update text info
      await updateProfile(editForm);

      // 2. If an image was selected in the edit modal, upload it now
      if (selectedImage && uploadProfilePic) {
        try {
          await uploadProfilePic(selectedImage);
        } catch (picErr) {
          showAlert("Warning", "Profile details saved, but profile picture failed to upload.", "warning");
        }
      }

      setEditSheetVisible(false);
      setSelectedImage(null);
      showAlert("Profile Updated", "Your changes have been saved gracefully.", "success");
    } catch (e: any) {
      showAlert("Error", e?.message || "Failed to save profile.", "danger");
    } finally {
      setEditSaving(false);
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
          <View style={styles.avatarWrapper}>
            <Avatar user={user} size={120} onPress={() => setImageSourceVisible(true)}>
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </Avatar>
          </View>
          <Text style={styles.userName}>{user?.name || "User Name"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "user@example.com"}
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
      <Modal visible={editSheetVisible} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableWithoutFeedback onPress={() => setEditSheetVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[styles.sheet, { height: EDIT_SHEET_HEIGHT + 60 }]}>
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
              {/* Profile Pic Edit in Modal */}
              <View style={styles.sheetAvatarSection}>
                <TouchableOpacity 
                   style={styles.sheetAvatarWrapper}
                   onPress={() => setImageSourceVisible(true)}
                >
                  <Image 
                    source={{ uri: selectedImage || user?.profile_pic || 'https://via.placeholder.com/150' }} 
                    style={styles.sheetAvatar}
                  />
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.sheetAvatarHint}>Tap to change photo</Text>
              </View>

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
                  onPress={() => {
                    setEditSheetVisible(false);
                    setSelectedImage(null);
                  }}
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

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Advanced Image Source Modal */}
      <Modal visible={imageSourceVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setImageSourceVisible(false)}>
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageSourceCard}>
              <Text style={styles.imageSourceTitle}>Update Profile Photo</Text>
              <TouchableOpacity 
                style={styles.imageSourceOption}
                onPress={() => pickImage(true)}
              >
                <View style={[styles.imageSourceIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="camera" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.imageSourceText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.imageSourceOption}
                onPress={() => pickImage(false)}
              >
                <View style={[styles.imageSourceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="images" size={24} color="#10b981" />
                </View>
                <Text style={styles.imageSourceText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.imageSourceOption, { borderBottomWidth: 0, marginTop: 10 }]}
                onPress={() => setImageSourceVisible(false)}
              >
                <Text style={[styles.imageSourceText, { color: COLORS.textMuted, width: '100%', textAlign: 'center' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  sheetAvatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sheetAvatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
    padding: 3,
    position: 'relative',
  },
  sheetAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  sheetAvatarHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageSourceCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageSourceTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  imageSourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imageSourceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  avatarWrapper: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
