import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { appointmentStatusLabels, createPastorAppointment, getMyAppointments, PastorAppointment } from "@/services/pastorAppointmentsService";
import { colors } from "@/theme/colors";
import { runRefresh } from "@/utils/refresh";
import { fonts } from "@/theme/fonts";

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value);
const formatDateValue = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const formatTimeValue = (value: Date) => `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
const formatReadableDate = (value: string) => {
  if (!value) return "Seleccionar fecha";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};
const getPickerValue = (mode: "date" | "time", dateValue: string, timeValue: string) => {
  const value = new Date();

  if (mode === "date" && isValidDate(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    value.setFullYear(year, month - 1, day);
  }

  if (mode === "time" && isValidTime(timeValue)) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    value.setHours(hours, minutes, 0, 0);
  }

  return value;
};

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [reason, setReason] = useState("");
  const [appointments, setAppointments] = useState<PastorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAppointments = async () => {
    const rows = await getMyAppointments();
    setAppointments(rows);
  };

  useEffect(() => {
    loadAppointments()
      .catch(() => Alert.alert("Error", "No fue posible cargar tus citas."))
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(loadAppointments).finally(() => setRefreshing(false));
  };

  const submitAppointment = async () => {
    if (!user?.id) {
      Alert.alert("Sin sesión", "Inicia sesión para separar una cita.");
      return;
    }

    if (!isValidDate(appointmentDate)) {
      Alert.alert("Fecha inválida", "Selecciona una fecha válida.");
      return;
    }

    if (!isValidTime(appointmentTime)) {
      Alert.alert("Hora inválida", "Selecciona una hora válida.");
      return;
    }

    if (reason.trim().length < 8) {
      Alert.alert("Motivo requerido", "Cuéntanos brevemente el motivo de la reunión.");
      return;
    }

    try {
      setSaving(true);
      await createPastorAppointment(user.id, appointmentDate, appointmentTime, reason);
      setAppointmentDate("");
      setAppointmentTime("");
      setReason("");
      await loadAppointments();
      Alert.alert("Cita enviada", "Tu solicitud fue enviada correctamente.");
    } catch {
      Alert.alert("Error", "No fue posible enviar la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed" || !selectedDate || !pickerMode) return;

    if (pickerMode === "date") {
      setAppointmentDate(formatDateValue(selectedDate));
    } else {
      setAppointmentTime(formatTimeValue(selectedDate));
    }
  };

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
          <Text style={styles.title}>Cita con el pastor</Text>
          <Text style={styles.subtitle}>Solicita una reunión pastoral y consulta el estado de tus solicitudes.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nueva solicitud</Text>
          <View style={styles.row}>
            <Pressable onPress={() => setPickerMode("date")} style={[styles.inputWrap, styles.flex]}>
              <Ionicons name="calendar" color={colors.gold} size={20} />
              <Text style={[styles.pickerText, !appointmentDate && styles.placeholderText]}>{formatReadableDate(appointmentDate)}</Text>
            </Pressable>
            <Pressable onPress={() => setPickerMode("time")} style={[styles.inputWrap, styles.timeInput]}>
              <Ionicons name="time" color={colors.gold} size={20} />
              <Text style={[styles.pickerText, !appointmentTime && styles.placeholderText]}>{appointmentTime || "Hora"}</Text>
            </Pressable>
          </View>
          {pickerMode ? (
            <DateTimePicker
              display={Platform.OS === "ios" ? "spinner" : "default"}
              mode={pickerMode}
              onChange={onPickerChange}
              value={getPickerValue(pickerMode, appointmentDate, appointmentTime)}
            />
          ) : null}
          <View style={styles.inputWrap}>
            <Ionicons name="chatbox-ellipses" color={colors.gold} size={20} />
            <TextInput multiline onChangeText={setReason} placeholder="Motivo de la reunión" placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} textAlignVertical="top" value={reason} />
          </View>
          <Pressable disabled={saving} onPress={submitAppointment} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, saving && styles.buttonDisabled]}>
            {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis solicitudes</Text>
          {loading ? (
            <ActivityIndicator color={colors.gold} />
          ) : appointments.length ? (
            appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentItem}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.appointmentTitle}>{appointment.appointment_date} · {appointment.appointment_time.slice(0, 5)}</Text>
                  <Text style={[styles.status, styles[`status_${appointment.status}`]]}>{appointmentStatusLabels[appointment.status]}</Text>
                </View>
                <Text style={styles.appointmentReason}>{appointment.reason}</Text>
                {appointment.response_message ? <Text style={styles.responseText}>Respuesta: {appointment.response_message}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aún no tienes solicitudes de cita.</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  section: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  inputWrap: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10 },
  timeInput: { width: 128 },
  input: { flex: 1, minHeight: 54, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  pickerText: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  placeholderText: { color: colors.textSecondary },
  textArea: { minHeight: 110, paddingTop: 14 },
  button: { minHeight: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  buttonPressed: { opacity: 0.88 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.background, fontSize: 15, fontFamily: fonts.black },
  appointmentItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 6 },
  appointmentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  appointmentTitle: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  appointmentReason: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  responseText: { color: colors.text, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium },
  status: { borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontFamily: fonts.black },
  status_enviado: { color: colors.background, backgroundColor: colors.gold },
  status_pendiente: { color: colors.text, backgroundColor: colors.cardGray },
  status_aceptada: { color: colors.background, backgroundColor: "#22C55E" },
  status_rechazada: { color: colors.text, backgroundColor: colors.danger },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular }
});
