import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const hasCompletedOnboarding = (profile: {
  church_attendance_time: string | null;
  is_being_discipled: boolean | null;
} | null) => Boolean(profile?.church_attendance_time?.trim()) && profile?.is_being_discipled !== null;

export default function OnboardingScreen() {
  const { session, profile, loading, updateOnboardingDetails } = useAuth();
  const [churchAttendanceTime, setChurchAttendanceTime] = useState(profile?.church_attendance_time ?? "");
  const [isBeingDiscipled, setIsBeingDiscipled] = useState<boolean | null>(profile?.is_being_discipled ?? null);
  const [saving, setSaving] = useState(false);

  if (!loading && !session) return <Redirect href="/auth/login" />;
  if (!loading && hasCompletedOnboarding(profile)) return <Redirect href="/(tabs)" />;

  const save = async () => {
    const cleanTime = churchAttendanceTime.trim().replace(/\s+/g, " ");

    if (!cleanTime) {
      Alert.alert("Campo requerido", "Cuéntanos cuánto tiempo llevas en la iglesia.");
      return;
    }

    if (isBeingDiscipled === null) {
      Alert.alert("Campo requerido", "Selecciona si estás siendo discipulado.");
      return;
    }

    try {
      setSaving(true);
      await updateOnboardingDetails(cleanTime, isBeingDiscipled);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar tus respuestas.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="person-add" color={colors.background} size={28} />
          </View>
          <Text style={styles.title}>Antes de continuar</Text>
          <Text style={styles.subtitle}>Queremos conocerte un poco mejor para acompañarte dentro de la comunidad.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>¿Cuánto tiempo llevas en la iglesia?</Text>
            <TextInput
              onChangeText={setChurchAttendanceTime}
              placeholder="Ej: 6 meses, 2 años, estoy empezando..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={churchAttendanceTime}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>¿Estás siendo discipulado?</Text>
            <View style={styles.segmented}>
              <Pressable onPress={() => setIsBeingDiscipled(true)} style={[styles.segment, isBeingDiscipled === true && styles.segmentActive]}>
                <Text style={[styles.segmentText, isBeingDiscipled === true && styles.segmentTextActive]}>Sí</Text>
              </Pressable>
              <Pressable onPress={() => setIsBeingDiscipled(false)} style={[styles.segment, isBeingDiscipled === false && styles.segmentActive]}>
                <Text style={[styles.segmentText, isBeingDiscipled === false && styles.segmentTextActive]}>No</Text>
              </Pressable>
            </View>
          </View>

          <Pressable disabled={saving} onPress={save} style={[styles.button, saving && styles.buttonDisabled]}>
            {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Continuar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 24 },
  header: { alignItems: "center", gap: 10 },
  iconWrap: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 30, lineHeight: 35, fontFamily: fonts.black, textAlign: "center" },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: fonts.regular, textAlign: "center" },
  card: { borderRadius: 18, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 18 },
  field: { gap: 10 },
  label: { color: colors.text, fontSize: 16, lineHeight: 22, fontFamily: fonts.extraBold },
  input: { minHeight: 54, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.regular },
  segmented: { flexDirection: "row", gap: 10 },
  segment: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  segmentText: { color: colors.textSecondary, fontSize: 15, fontFamily: fonts.bold },
  segmentTextActive: { color: colors.background },
  button: { minHeight: 54, borderRadius: 14, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.background, fontSize: 16, fontFamily: fonts.black }
});
