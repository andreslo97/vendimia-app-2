import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { AdminHomeContent, getAdminHomeContent, updateAdminHomeRow } from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [data, setData] = useState<AdminHomeContent | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { getAdminHomeContent().then(setData).catch(() => setData(null)); }, []);

  const save = async (section: "header" | "banner" | "dailyWord") => {
    if (!profile?.id || !data) return;
    const row = data[section];
    if (!row) return;

    const table = section === "header" ? "home_header" : section === "banner" ? "home_banners" : "daily_words";
    const { id, ...payload } = row;
    try {
      setSaving(section);
      await updateAdminHomeRow(profile.id, table, id, payload);
      Alert.alert("Contenido actualizado", "Los cambios ya están disponibles en Inicio.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar.");
    } finally {
      setSaving(null);
    }
  };

  if (profile?.role !== "super_admin") return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  if (!data) return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" color={colors.text} size={22} /></Pressable>
        <View style={styles.header}><Text style={styles.title}>Contenido de Inicio</Text><Text style={styles.subtitle}>Edita los textos principales sin tocar la base de datos.</Text></View>

        {data.header ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encabezado</Text>
            <TextInput onChangeText={(value) => setData({ ...data, header: { ...data.header!, app_label: value } })} placeholder="Nombre" style={styles.input} value={data.header.app_label ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, header: { ...data.header!, title: value } })} placeholder="Título" style={styles.input} value={data.header.title ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, header: { ...data.header!, subtitle: value } })} placeholder="Subtítulo" style={styles.input} value={data.header.subtitle ?? ""} />
            <SaveButton loading={saving === "header"} onPress={() => save("header")} />
          </View>
        ) : null}

        {data.banner ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Banner principal</Text>
            <TextInput onChangeText={(value) => setData({ ...data, banner: { ...data.banner!, title: value } })} placeholder="Título" style={styles.input} value={data.banner.title ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, banner: { ...data.banner!, subtitle: value } })} placeholder="Subtítulo" style={styles.input} value={data.banner.subtitle ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, banner: { ...data.banner!, badge_text: value } })} placeholder="Etiqueta" style={styles.input} value={data.banner.badge_text ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, banner: { ...data.banner!, button_text: value } })} placeholder="Texto del botón" style={styles.input} value={data.banner.button_text ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, banner: { ...data.banner!, image_url: value } })} placeholder="URL de imagen" style={styles.input} value={data.banner.image_url ?? ""} />
            <SaveButton loading={saving === "banner"} onPress={() => save("banner")} />
          </View>
        ) : null}

        {data.dailyWord ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Palabra del día</Text>
            <TextInput multiline onChangeText={(value) => setData({ ...data, dailyWord: { ...data.dailyWord!, verse: value } })} placeholder="Versículo" style={[styles.input, styles.area]} value={data.dailyWord.verse ?? ""} />
            <TextInput onChangeText={(value) => setData({ ...data, dailyWord: { ...data.dailyWord!, reference: value } })} placeholder="Referencia" style={styles.input} value={data.dailyWord.reference ?? ""} />
            <TextInput multiline onChangeText={(value) => setData({ ...data, dailyWord: { ...data.dailyWord!, reflection: value } })} placeholder="Reflexión" style={[styles.input, styles.area]} value={data.dailyWord.reflection ?? ""} />
            <SaveButton loading={saving === "dailyWord"} onPress={() => save("dailyWord")} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SaveButton({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return <Pressable disabled={loading} onPress={onPress} style={styles.button}>{loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar cambios</Text>}</Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 18 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  section: { padding: 16, gap: 11, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 13 },
  area: { minHeight: 90, paddingTop: 13 },
  button: { minHeight: 50, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold }
});
