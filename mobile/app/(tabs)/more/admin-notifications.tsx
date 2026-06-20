import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/services/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { runRefresh } from "@/utils/refresh";

type NotificationRow = {
  id: number;
  title: string;
  body: string;
  target_role: string | null;
  notification_type: string;
  sent_at: string | null;
  created_at: string;
};

type NotificationMasterRow = {
  id: number;
  notification_key: string;
  category: string;
  name: string;
  implementation_status: "ready" | "planned";
  is_active: boolean;
};

const roleOptions = [
  { label: "Todos", value: null },
  { label: "Usuarios", value: "user" },
  { label: "Líderes", value: "lider" },
  { label: "Super admin", value: "super_admin" }
];

type TokenDiagnostics = {
  active?: number;
  standalone?: number;
  installed?: number;
  by_app_ownership?: Record<string, number>;
  by_platform?: Record<string, { active?: number; installed?: number; total?: number }>;
};

type PushDiagnostics = {
  tokens?: number;
  accepted?: number;
  failed?: number;
  first_error?: {
    message?: string | null;
    code?: string | null;
  } | null;
};

const formatDiagnostics = (diagnostics?: TokenDiagnostics) => {
  if (!diagnostics) return "";

  const installed = diagnostics.installed ?? diagnostics.standalone ?? 0;
  const platformText = diagnostics.by_platform
    ? Object.entries(diagnostics.by_platform)
        .map(([platform, counts]) => `${platform}: ${counts.active ?? 0} activos, ${counts.installed ?? 0} instalados`)
        .join("\n")
    : "";
  const ownershipText = diagnostics.by_app_ownership
    ? Object.entries(diagnostics.by_app_ownership)
        .map(([ownership, count]) => `${ownership}: ${count}`)
        .join(", ")
    : "";

  return [
    `Diagnóstico: ${diagnostics.active ?? 0} activos, ${installed} instalados.`,
    platformText,
    ownershipText ? `Origen: ${ownershipText}` : ""
  ]
    .filter(Boolean)
    .join("\n");
};

const formatPushDiagnostics = (diagnostics?: PushDiagnostics) => {
  if (!diagnostics) return "";

  const error = diagnostics.first_error;

  return [
    `Intentos: ${diagnostics.tokens ?? 0}. Aceptadas por Expo: ${diagnostics.accepted ?? 0}. Fallidas: ${diagnostics.failed ?? 0}.`,
    error?.code ? `Código: ${error.code}` : "",
    error?.message ? `Error: ${error.message}` : ""
  ]
    .filter(Boolean)
    .join("\n");
};

export default function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [masterNotifications, setMasterNotifications] = useState<NotificationMasterRow[]>([]);
  const [updatingMasterId, setUpdatingMasterId] = useState<number | null>(null);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,target_role,notification_type,sent_at,created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    setNotifications(data ?? []);
  };

  const loadMasterNotifications = async () => {
    const { data, error } = await supabase
      .from("notification_master")
      .select("id,notification_key,category,name,implementation_status,is_active")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    setMasterNotifications((data ?? []) as NotificationMasterRow[]);
  };

  useEffect(() => {
    Promise.all([loadNotifications(), loadMasterNotifications()]).catch(() => undefined);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(() => Promise.all([loadNotifications(), loadMasterNotifications()])).finally(() => setRefreshing(false));
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
      const sentCount = data?.sent ?? 0;
      const attemptedCount = data?.attempted ?? sentCount;
      const diagnosticsText = formatDiagnostics(data?.diagnostics);
      const pushDiagnosticsText = formatPushDiagnostics(data?.push_diagnostics);

      Alert.alert(
        sentCount ? "Notificación enviada" : attemptedCount ? "No aceptada por Expo" : "Sin dispositivos instalados",
        sentCount
          ? `Se enviaron ${sentCount} notificaciones.`
          : attemptedCount
            ? `Hay tokens instalados, pero Expo no aceptó el envío.${pushDiagnosticsText ? `\n\n${pushDiagnosticsText}` : ""}`
            : `No hay tokens activos de la app instalada. Cada usuario debe abrir la última versión instalada desde Play Store/APK y aceptar las notificaciones.${diagnosticsText ? `\n\n${diagnosticsText}` : ""}`
      );
    } catch {
      Alert.alert("Error", "No fue posible enviar la notificación.");
    } finally {
      setSending(false);
    }
  };

  const toggleMasterNotification = async (notification: NotificationMasterRow) => {
    try {
      setUpdatingMasterId(notification.id);
      const { error } = await supabase
        .from("notification_master")
        .update({
          is_active: !notification.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", notification.id);

      if (error) throw error;
      await loadMasterNotifications();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar la automatización.");
    } finally {
      setUpdatingMasterId(null);
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl colors={[colors.gold]} progressBackgroundColor={colors.cardDark} refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
        style={styles.screen}
      >
      <Pressable onPress={() => router.replace("/(tabs)/more/admin" as never)} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>Envía mensajes y controla las automatizaciones de la iglesia.</Text>
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
        <Text style={styles.sectionTitle}>Notificaciones automáticas</Text>
        <Text style={styles.sectionDescription}>Activa o desactiva las reglas configuradas en la tabla MASTER.</Text>
        {masterNotifications.map((notification) => (
          <View key={notification.id} style={styles.masterItem}>
            <View style={styles.masterContent}>
              <Text style={styles.masterName}>{notification.name}</Text>
              <Text style={styles.masterMeta}>
                {notification.category} · {notification.implementation_status === "ready" ? "Disponible" : "Planificada"}
              </Text>
            </View>
            <Pressable
              disabled={updatingMasterId === notification.id || notification.implementation_status !== "ready"}
              onPress={() => toggleMasterNotification(notification)}
              style={[
                styles.toggle,
                notification.is_active && styles.toggleActive,
                notification.implementation_status !== "ready" && styles.toggleDisabled
              ]}
            >
              <View style={[styles.toggleThumb, notification.is_active && styles.toggleThumbActive]} />
            </Pressable>
          </View>
        ))}
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
    </KeyboardAvoidingView>
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
  sectionDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
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
  masterItem: { minHeight: 58, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  masterContent: { flex: 1, gap: 3 },
  masterName: { color: colors.text, fontSize: 14, fontFamily: fonts.bold },
  masterMeta: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, backgroundColor: colors.cardGray, justifyContent: "center" },
  toggleActive: { backgroundColor: colors.gold },
  toggleDisabled: { opacity: 0.4 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.textSecondary },
  toggleThumbActive: { alignSelf: "flex-end", backgroundColor: colors.background },
  notificationItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 4 },
  notificationTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  notificationBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  notificationMeta: { color: colors.gold, fontSize: 11, fontFamily: fonts.bold, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular }
});
