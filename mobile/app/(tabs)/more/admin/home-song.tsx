import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import {
  AdminHomeFeaturedSong,
  getAdminHomeFeaturedSong,
  saveAdminHomeFeaturedSong
} from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const emptySong = (): Omit<AdminHomeFeaturedSong, "id"> => ({
  title: "",
  artist: "",
  audio_preview_url: "",
  cover_url: "",
  reference_url: "",
  preview_duration_seconds: 60,
  is_active: true
});

export default function AdminHomeSongScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [song, setSong] = useState<Omit<AdminHomeFeaturedSong, "id"> & { id?: number }>(emptySong());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminHomeFeaturedSong()
      .then((data) => setSong(data ?? emptySong()))
      .catch((error) => Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar la canción."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!profile?.id || !song.title.trim() || !song.audio_preview_url.trim()) {
      Alert.alert("Campos requeridos", "Ingresa el nombre de la canción y la URL del audio.");
      return;
    }

    try {
      setSaving(true);
      await saveAdminHomeFeaturedSong(profile.id, song);
      const updated = await getAdminHomeFeaturedSong();
      if (updated) setSong(updated);
      Alert.alert("Canción guardada", "El reproductor de Inicio quedó actualizado.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar la canción.");
    } finally {
      setSaving(false);
    }
  };

  if (profile?.role !== "super_admin") {
    return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Canción de Inicio</Text>
          <Text style={styles.subtitle}>Configura el fragmento público que cualquier miembro puede reproducir en la pantalla principal.</Text>
        </View>

        <View style={styles.section}>
          <TextInput
            onChangeText={(value) => setSong({ ...song, title: value })}
            placeholder="Nombre de la canción"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={song.title}
          />
          <TextInput
            onChangeText={(value) => setSong({ ...song, artist: value })}
            placeholder="Artista"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={song.artist ?? ""}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={(value) => setSong({ ...song, audio_preview_url: value })}
            placeholder="URL pública del MP3 o M4A"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={song.audio_preview_url}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={(value) => setSong({ ...song, cover_url: value })}
            placeholder="URL pública de la portada"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={song.cover_url ?? ""}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="url"
            onChangeText={(value) => setSong({ ...song, reference_url: value })}
            placeholder="Enlace de referencia opcional"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={song.reference_url ?? ""}
          />
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => setSong({ ...song, preview_duration_seconds: Math.min(60, Number.parseInt(value, 10) || 1) })}
            placeholder="Duración entre 1 y 60 segundos"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={String(song.preview_duration_seconds)}
          />
          <View style={styles.setting}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingText}>Mostrar en Inicio</Text>
              <Text style={styles.settingDescription}>Al desactivarla, el reproductor desaparece para todos.</Text>
            </View>
            <Switch
              onValueChange={(value) => setSong({ ...song, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={song.is_active}
            />
          </View>
          <Pressable disabled={saving} onPress={save} style={[styles.button, saving && styles.disabled]}>
            {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar canción pública</Text>}
          </Pressable>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle" color={colors.gold} size={20} />
          <Text style={styles.noteText}>Utiliza audio propio o autorizado. El reproductor detendrá el fragmento automáticamente al alcanzar la duración configurada.</Text>
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
  setting: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  settingCopy: { flex: 1, gap: 3 },
  settingText: { color: colors.text, fontFamily: fonts.semiBold },
  settingDescription: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontFamily: fonts.regular },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold },
  note: { borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cardDark, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noteText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular }
});
