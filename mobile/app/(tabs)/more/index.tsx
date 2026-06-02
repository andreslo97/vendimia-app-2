import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { ChurchLocationsHeader, getChurchLocationsHeader } from "@/services/churchLocationsService";
import { getLeadershipScheduleHeader, LeadershipScheduleHeader } from "@/services/leadershipScheduleService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();
  const [scheduleHeader, setScheduleHeader] = useState<LeadershipScheduleHeader | null>(null);
  const [locationsHeader, setLocationsHeader] = useState<ChurchLocationsHeader | null>(null);

  useEffect(() => {
    getLeadershipScheduleHeader().then(setScheduleHeader).catch(() => setScheduleHeader(null));
    getChurchLocationsHeader().then(setLocationsHeader).catch(() => setLocationsHeader(null));
  }, []);

  const closeSession = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" color={colors.gold} size={24} />
        </View>
        <View style={styles.flex}>
          {profile?.full_name ? <Text style={styles.title}>{profile.full_name}</Text> : null}
          {profile?.email || user?.email ? <Text style={styles.body}>{profile?.email ?? user?.email}</Text> : null}
          {profile?.role ? <Text style={styles.role}>{profile.role}</Text> : null}
        </View>
      </View>

      <Pressable onPress={() => router.push("/(tabs)/more/info" as never)} style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Ionicons name="information-circle" color={colors.gold} size={24} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.menuTitle}>Información</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
      </Pressable>

      {scheduleHeader?.menu_title ? (
        <Pressable onPress={() => router.push("/(tabs)/more/leadership-schedule" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="calendar-number" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>{scheduleHeader.menu_title}</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}

      {locationsHeader?.menu_title ? (
        <Pressable onPress={() => router.push("/(tabs)/more/locations" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="location" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>{locationsHeader.menu_title}</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}

      <Pressable onPress={closeSession} style={styles.signOut}>
        <Ionicons name="log-out-outline" color={colors.background} size={20} />
        <Text style={styles.signOutText}>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, gap: 18 },
  profileCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, flexDirection: "row", gap: 14, alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 20, fontFamily: fonts.extraBold },
  body: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, marginTop: 4 },
  role: { color: colors.gold, fontSize: 12, fontFamily: fonts.bold, marginTop: 8 },
  menuItem: { minHeight: 64, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: { width: 42, height: 42, borderRadius: 8, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  menuTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  signOut: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  signOutText: { color: colors.background, fontSize: 16, fontFamily: fonts.extraBold }
});
