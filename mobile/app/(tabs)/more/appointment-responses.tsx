import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { appointmentStatusLabels, AppointmentStatus, getAppointmentsForResponse, PastorAppointment, AppointmentProfile, respondPastorAppointment } from "@/services/pastorAppointmentsService";
import { colors } from "@/theme/colors";
import { runRefresh } from "@/utils/refresh";
import { fonts } from "@/theme/fonts";

const responseStatuses: AppointmentStatus[] = ["pendiente", "aceptada", "rechazada"];

export default function AppointmentResponsesScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const [appointments, setAppointments] = useState<PastorAppointment[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, AppointmentProfile>>({});
  const [responseMessages, setResponseMessages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadAppointments = async () => {
    const data = await getAppointmentsForResponse();
    setAppointments(data.appointments);
    setProfilesById(data.profilesById);
  };

  useEffect(() => {
    loadAppointments()
      .catch(() => Alert.alert("Error", "No fue posible cargar las citas."))
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(loadAppointments).finally(() => setRefreshing(false));
  };

  const respond = async (appointment: PastorAppointment, status: AppointmentStatus) => {
    if (!user?.id) return;

    try {
      setUpdatingId(appointment.id);
      await respondPastorAppointment(appointment.id, status, responseMessages[appointment.id] ?? appointment.response_message ?? "", user.id);
      await loadAppointments();
      Alert.alert("Respuesta guardada", `La cita quedo en estado ${appointmentStatusLabels[status]}.`);
    } catch {
      Alert.alert("Error", "No fue posible responder la cita.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!profile?.can_manage_appointments) {
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
      >
        <Pressable onPress={() => router.replace("/(tabs)/more" as never)} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Responder citas</Text>
          <Text style={styles.subtitle}>Revisa solicitudes pastorales y actualiza su estado.</Text>
        </View>

        <View style={styles.section}>
          {loading ? (
            <ActivityIndicator color={colors.gold} />
          ) : appointments.length ? (
            appointments.map((appointment) => {
              const appointmentProfile = profilesById[appointment.user_id];
              const phone = [appointmentProfile?.phone_country_code, appointmentProfile?.phone_number].filter(Boolean).join(" ");

              return (
                <View key={appointment.id} style={styles.appointmentItem}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentTitle}>{appointment.appointment_date} · {appointment.appointment_time.slice(0, 5)}</Text>
                    <Text style={[styles.status, styles[`status_${appointment.status}`]]}>{appointmentStatusLabels[appointment.status]}</Text>
                  </View>
                  <Text style={styles.personText}>{appointmentProfile?.full_name ?? "Usuario"} · {appointmentProfile?.email ?? appointment.user_id}</Text>
                  {phone ? <Text style={styles.personText}>{phone}</Text> : null}
                  <Text style={styles.reasonText}>{appointment.reason}</Text>
                  <TextInput
                    multiline
                    onChangeText={(value) => setResponseMessages((current) => ({ ...current, [appointment.id]: value }))}
                    placeholder="Respuesta para el usuario"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.textArea}
                    textAlignVertical="top"
                    value={responseMessages[appointment.id] ?? appointment.response_message ?? ""}
                  />
                  <View style={styles.actions}>
                    {responseStatuses.map((status) => (
                      <Pressable key={status} disabled={updatingId === appointment.id} onPress={() => respond(appointment, status)} style={[styles.actionButton, status === "aceptada" && styles.acceptButton, status === "rechazada" && styles.rejectButton]}>
                        {updatingId === appointment.id ? <ActivityIndicator color={colors.background} /> : <Text style={styles.actionText}>{appointmentStatusLabels[status]}</Text>}
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No hay solicitudes de cita.</Text>
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
  section: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14 },
  appointmentItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, gap: 8 },
  appointmentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  appointmentTitle: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  personText: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.medium },
  reasonText: { color: colors.text, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  textArea: { minHeight: 82, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, color: colors.text, padding: 12, fontSize: 14, fontFamily: fonts.regular },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: { minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardGray, paddingHorizontal: 12 },
  acceptButton: { backgroundColor: "#22C55E" },
  rejectButton: { backgroundColor: colors.danger },
  actionText: { color: colors.background, fontSize: 12, fontFamily: fonts.black },
  status: { borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontFamily: fonts.black },
  status_enviado: { color: colors.background, backgroundColor: colors.gold },
  status_pendiente: { color: colors.text, backgroundColor: colors.cardGray },
  status_aceptada: { color: colors.background, backgroundColor: "#22C55E" },
  status_rechazada: { color: colors.text, backgroundColor: colors.danger },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular }
});
