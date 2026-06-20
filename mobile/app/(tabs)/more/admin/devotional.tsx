import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { getTodayDailyDevotional, saveTodayDailyDevotional } from "@/services/devotionalService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function AdminDevotionalScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [verse, setVerse] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTodayDailyDevotional()
      .then((item) => {
        setTitle(item?.title ?? "");
        setVerse(item?.verse ?? "");
        setBody(item?.body ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!profile?.id || !title.trim() || !verse.trim() || !body.trim()) {
      Alert.alert("Campos requeridos", "Ingresa título, versículo y cuerpo.");
      return;
    }

    try {
      setSaving(true);
      await saveTodayDailyDevotional(profile.id, title, verse, body);
      Alert.alert("Devocional guardado", "El contenido de hoy quedó publicado.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (profile?.role !== "super_admin") return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" color={colors.text} size={22} /></Pressable>
        <View style={styles.header}>
          <Text style={styles.title}>Devocional diario</Text>
          <Text style={styles.subtitle}>Publica o edita el contenido correspondiente a hoy.</Text>
        </View>
        <View style={styles.section}>
          <TextInput onChangeText={setTitle} placeholder="Título" style={styles.input} value={title} />
          <TextInput onChangeText={setVerse} placeholder="Versículo" style={styles.input} value={verse} />
          <TextInput multiline onChangeText={setBody} placeholder="Cuerpo del devocional" style={[styles.input, styles.textArea]} textAlignVertical="top" value={body} />
          <Pressable disabled={saving} onPress={save} style={[styles.button, saving && styles.disabled]}>
            {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar y publicar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 18 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  section: { padding: 16, gap: 12, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  input: { minHeight: 52, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 14, fontFamily: fonts.regular },
  textArea: { minHeight: 180, paddingTop: 14 },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold, fontSize: 15 }
});
