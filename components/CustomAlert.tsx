import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "info" | "success" | "danger" | "warning";
}

const { width } = Dimensions.get("window");

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  type = "info",
}: CustomAlertProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "danger":
        return "alert-circle";
      case "warning":
        return "warning";
      default:
        return "information-circle";
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return COLORS.success;
      case "danger":
        return COLORS.danger;
      case "warning":
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.alertBox}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getColor() + "15" },
            ]}
          >
            <Ionicons name={getIcon() as any} size={36} color={getColor()} />
          </View>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          <View style={styles.actions}>
            {onConfirm && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: getColor() },
                !onConfirm && { flex: 1 },
              ]}
              onPress={onConfirm || onClose}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  alertBox: {
    width: width * 0.85,
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "800",
  },
  confirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
