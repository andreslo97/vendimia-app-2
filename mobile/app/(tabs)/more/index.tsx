import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { ChurchGroupContactsHeader, getChurchGroupContactsHeader } from "@/services/churchGroupContactsService";
import { ChurchLocationsHeader, getChurchLocationsHeader } from "@/services/churchLocationsService";
import { getGivingAccount, GivingAccount } from "@/services/givingAccountService";
import { getLeadershipScheduleHeader, LeadershipScheduleHeader } from "@/services/leadershipScheduleService";
import { getWeeklySongsHeader, WeeklySongsHeader } from "@/services/weeklySongsService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const PRIVACY_POLICY_URL = "https://andreslo97.github.io/iglesia-vendimia-privacy/";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut, updateProfileAvatar } = useAuth();
  const [scheduleHeader, setScheduleHeader] = useState<LeadershipScheduleHeader | null>(null);
  const [locationsHeader, setLocationsHeader] = useState<ChurchLocationsHeader | null>(null);
  const [songsHeader, setSongsHeader] = useState<WeeklySongsHeader | null>(null);
  const [groupContactsHeader, setGroupContactsHeader] = useState<ChurchGroupContactsHeader | null>(null);
  const [givingAccount, setGivingAccount] = useState<GivingAccount | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    getLeadershipScheduleHeader().then(setScheduleHeader).catch(() => setScheduleHeader(null));
    getChurchLocationsHeader().then(setLocationsHeader).catch(() => setLocationsHeader(null));
    getWeeklySongsHeader().then(setSongsHeader).catch(() => setSongsHeader(null));
    getChurchGroupContactsHeader().then(setGroupContactsHeader).catch(() => setGroupContactsHeader(null));
    getGivingAccount().then(setGivingAccount).catch(() => setGivingAccount(null));
  }, []);

  const closeSession = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  const changeProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos para actualizar tu foto de perfil.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 0.82
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setUploadingAvatar(true);
      await updateProfileAvatar(result.assets[0].uri);
      Alert.alert("Foto actualizada", "Tu foto de perfil fue actualizada correctamente.");
    } catch {
      Alert.alert("Error", "No fue posible actualizar tu foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]} style={styles.screen}>
      <View style={styles.profileCard}>
        <Pressable disabled={uploadingAvatar} onPress={changeProfilePhoto} style={styles.avatar}>
          {uploadingAvatar ? (
            <ActivityIndicator color={colors.gold} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" color={colors.gold} size={24} />
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" color={colors.background} size={12} />
          </View>
        </Pressable>
        <View style={styles.flex}>
          {profile?.full_name ? <Text style={styles.title}>{profile.full_name}</Text> : null}
          {profile?.email || user?.email ? <Text style={styles.body}>{profile?.email ?? user?.email}</Text> : null}
          {profile?.role ? <Text style={styles.role}>{profile.role}</Text> : null}
        </View>
      </View>

      <Pressable onPress={() => router.push("/(tabs)/more/profile" as never)} style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Ionicons name="person-circle" color={colors.gold} size={24} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.menuTitle}>Perfil y cuenta</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
      </Pressable>

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

      {songsHeader?.menu_title ? (
        <Pressable onPress={() => router.push("/(tabs)/more/weekly-songs" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="musical-notes" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>{songsHeader.menu_title}</Text>
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

      {groupContactsHeader?.menu_title ? (
        <Pressable onPress={() => router.push("/(tabs)/more/group-contacts" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="people" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>{groupContactsHeader.menu_title}</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}

      {givingAccount?.menu_title ? (
        <Pressable onPress={() => router.push("/(tabs)/more/giving" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="qr-code" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>{givingAccount.menu_title}</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}

      <Pressable onPress={() => router.push("/(tabs)/more/appointments" as never)} style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Ionicons name="chatbubbles" color={colors.gold} size={24} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.menuTitle}>Cita con el pastor</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
      </Pressable>

      {profile?.can_manage_appointments ? (
        <Pressable onPress={() => router.push("/(tabs)/more/appointment-responses" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="checkmark-done-circle" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>Responder citas</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}

      {profile?.role === "super_admin" ? (
        <Pressable onPress={() => router.push("/(tabs)/more/admin" as never)} style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="settings" color={colors.gold} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.menuTitle}>Panel admin</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}

      <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Ionicons name="shield-checkmark" color={colors.gold} size={24} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.menuTitle}>Política de privacidad</Text>
        </View>
        <Ionicons name="open-outline" color={colors.textSecondary} size={20} />
      </Pressable>

      <Pressable onPress={closeSession} style={styles.signOut}>
        <Ionicons name="log-out-outline" color={colors.background} size={20} />
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 18 },
  profileCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, flexDirection: "row", gap: 14, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarEditBadge: { position: "absolute", right: -1, bottom: -1, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.cardDark },
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
