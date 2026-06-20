import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { getAdminSystemStats } from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { runRefresh } from "@/utils/refresh";

type Stats = Awaited<ReturnType<typeof getAdminSystemStats>>;

export default function AdminSystemScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setStats(await getAdminSystemStats());
  useEffect(() => { load().catch(() => undefined); }, []);
  const refresh = async () => { setRefreshing(true); await runRefresh(load).finally(() => setRefreshing(false)); };

  if (profile?.role !== "super_admin") return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  if (!stats) return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;

  const items = [
    ["Usuarios", stats.users, "people"],
    ["Tokens push activos", stats.activeTokens, "notifications"],
    ["Trabajos pendientes", stats.pendingJobs, "hourglass"],
    ["Trabajos fallidos", stats.failedJobs, "warning"],
    ["Citas pendientes", stats.pendingAppointments, "chatbubbles"],
    ["Eventos activos", stats.activeEvents, "calendar"]
  ] as const;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]} refreshControl={<RefreshControl colors={[colors.gold]} onRefresh={refresh} refreshing={refreshing} tintColor={colors.gold} />} style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" color={colors.text} size={22} /></Pressable>
      <View style={styles.header}><Text style={styles.title}>Estado del sistema</Text><Text style={styles.subtitle}>Resumen operativo de la aplicación.</Text></View>
      <View style={styles.grid}>
        {items.map(([label, value, icon]) => (
          <View key={label} style={styles.card}>
            <Ionicons name={icon} color={colors.gold} size={24} />
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>
      {stats.failedJobs > 0 ? <View style={styles.alert}><Ionicons name="warning" color={colors.danger} size={20} /><Text style={styles.alertText}>Hay trabajos de notificación fallidos que requieren revisión.</Text></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 18 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", minHeight: 130, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 15, gap: 8, justifyContent: "center" },
  value: { color: colors.text, fontSize: 30, fontFamily: fonts.black },
  label: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: fonts.medium },
  alert: { borderRadius: 8, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.cardDark, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  alertText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 }
});
