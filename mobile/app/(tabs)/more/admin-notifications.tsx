import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/services/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type NotificationRow = {
  id: number;
  title: string;
  body: string;
  target_role: string | null;
  notification_type: string;
  sent_at: string | null;
  created_at: string;
};

const roleOptions = [
  { label: "Todos", value: null },
  { label: "Usuarios", value: "user" },
  { label: "Líderes", value: "lider" },
  { label: "Super admin", value: "super_admin" }
];

export default function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,target_role,notification_type,sent_at,created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    setNotifications(data ?? []);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadNotifications().finally(() => setRefreshing(false));
  };

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Campos requeridos", "Ingresa título y mensaje.");
      return;
    }

    try {
      setSending(true);
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: title.trim(),
          body: body.trim(),
          targetRole
        }
      });

      if (error) throw error;

      setTitle("");
      setBody("");
      await loadNotifications();
      Alert.alert("Notificación enviada", `Se enviaron ${data?.sent ?? 0} notificaciones.`);
    } catch {
      Alert.alert("Error", "No fue posible enviar la notificación.");
    } finally {
      setSending(false);
    }
  };

  if (profile?.role !== "super_admin") {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Acceso restringido</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      style={styles.screen}
    >
      <Pressable onPress={() => router.replace("/(tabs)/more" as never)} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Panel admin</Text>
        <Text style={styles.subtitle}>Envía notificaciones manuales a toda la iglesia o a un rol específico.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nueva notificación</Text>
        <TextInput onChangeText={setTitle} placeholder="Título" style={styles.input} value={title} />
        <TextInput multiline onChangeText={setBody} placeholder="Mensaje" style={[styles.input, styles.textArea]} textAlignVertical="top" value={body} />

        <View style={styles.roles}>
          {roleOptions.map((role) => {
            const active = targetRole === role.value;
            return (
              <Pressable key={role.label} onPress={() => setTargetRole(role.value)} style={[styles.rolePill, active && styles.rolePillActive]}>
                <Text style={[styles.roleText, active && styles.roleTextActive]}>{role.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable disabled={sending} onPress={sendNotification} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, sending && styles.buttonDisabled]}>
          {sending ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Enviar notificación</Text>}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas notificaciones</Text>
        {notifications.length ? (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationBody}>{notification.body}</Text>
              <Text style={styles.notificationMeta}>
                {notification.target_role ? `Rol: ${notification.target_role}` : "Todos"} · {notification.notification_type}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aún no hay notificaciones registradas.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  section: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, color: colors.text, paddingHorizontal: 14, fontFamily: fonts.regular },
  textArea: { minHeight: 110, paddingTop: 14 },
  roles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rolePill: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  rolePillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  roleText: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bold },
  roleTextActive: { color: colors.background },
  button: { minHeight: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  buttonPressed: { opacity: 0.88 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.background, fontSize: 15, fontFamily: fonts.black },
  notificationItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 4 },
  notificationTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  notificationBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  notificationMeta: { color: colors.gold, fontSize: 11, fontFamily: fonts.bold, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular }
});
