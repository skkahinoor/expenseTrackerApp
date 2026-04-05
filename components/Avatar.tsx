import { COLORS } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AvatarProps {
  user: any;
  size?: number;
  onPress?: () => void;
  style?: any;
  children?: React.ReactNode;
}

export default function Avatar({ user, size = 44, onPress, style, children }: AvatarProps) {
  const router = useRouter();
  const handlePress = onPress || (() => router.push("/profile"));

  const getInitials = (name: string) => {
    if (!name) return "??";
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return "??";
    
    const firstInitial = words[0]?.charAt(0) || "";
    const lastInitial = words.length > 1 ? words[words.length - 1].charAt(0) : "";
    
    return (firstInitial + lastInitial).toUpperCase();
  };

  const initials = getInitials(user?.name);

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8} 
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
    >
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        {user?.profile_pic ? (
          <Image
            source={{ uri: user.profile_pic }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
            {initials}
          </Text>
        )}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  initials: {
    color: "#fff",
    fontWeight: "900",
  },
});
