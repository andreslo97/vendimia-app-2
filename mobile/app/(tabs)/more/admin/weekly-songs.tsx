import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  AdminWeeklySong,
  AdminWeeklySongsHeader,
  getAdminWeeklySongs,
  saveAdminWeeklySong,
  saveAdminWeeklySongsHeader,
  setAdminWeeklySongActive
} from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const emptyHeader = (): Omit<AdminWeeklySongsHeader, "id"> => ({
  menu_title: "Canciones semanales",
  screen_title: "Canciones semanales",
  week_label: "",
  subtitle: "",
  is_active: true
});

export default function AdminWeeklySongsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useAuth();
  const [header, setHeader] = useState<Omit<AdminWeeklySongsHeader, "id"> & { id?: number }>(emptyHeader());
  const [songs, setSongs] = useState<AdminWeeklySong[]>([]);
  const [songForm, setSongForm] = useState<AdminWeeklySong | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingSong, setSavingSong] = useState(false);
  const [changingSongId, setChangingSongId] = useState<number | null>(null);

  const load = async () => {
    const data = await getAdminWeeklySongs();
    setHeader(data.header ?? emptyHeader());
    setSongs(data.songs);
  };

  useEffect(() => {
    load()
      .catch((error) => Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar las canciones."))
      .finally(() => setLoading(false));
  }, []);

  const saveHeader = async () => {
    if (!profile?.id || !header.menu_title?.trim() || !header.screen_title?.trim()) {
      Alert.alert("Campos requeridos", "Ingresa el nombre del menú y el título de la pantalla.");
      return;
    }

    try {
      setSavingHeader(true);
      await saveAdminWeeklySongsHeader(profile.id, header);
      await load();
      Alert.alert("Encabezado guardado", "La información semanal quedó actualizada.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar el encabezado.");
    } finally {
      setSavingHeader(false);
    }
  };

  const editSong = (song: AdminWeeklySong) => {
    setSongForm(song);
    scrollRef.current?.scrollTo({ y: 470, animated: true });
  };

  const resetSongForm = () => setSongForm(null);

  const saveSong = async () => {
    if (!profile?.id || !songForm?.id || !songForm.title.trim()) {
      Alert.alert("Campo requerido", "Ingresa el nombre de la canción.");
      return;
    }

    try {
      setSavingSong(true);
      await saveAdminWeeklySong(profile.id, songForm);
      await load();
      resetSongForm();
      Alert.alert("Canción guardada", "El repertorio semanal quedó actualizado.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar la canción.");
    } finally {
      setSavingSong(false);
    }
  };

  const changeSongState = (song: AdminWeeklySong) => {
    const nextActive = !song.is_active;
    Alert.alert(
      nextActive ? "Restaurar canción" : "Quitar de la semana",
      nextActive
        ? `¿Deseas volver a mostrar "${song.title}"?`
        : `Se ocultará "${song.title}" de la app, pero seguirá guardada en la base de datos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: nextActive ? "Restaurar" : "Quitar",
          style: nextActive ? "default" : "destructive",
          onPress: async () => {
            if (!profile?.id) return;
            try {
              setChangingSongId(song.id);
              await setAdminWeeklySongActive(profile.id, song, nextActive);
              await load();
              if (songForm?.id === song.id) resetSongForm();
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar la canción.");
            } finally {
              setChangingSongId(null);
            }
          }
        }
      ]
    );
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
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Administrar repertorio</Text>
          <Text style={styles.subtitle}>Actualiza la información semanal o edita canciones ya registradas.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la semana</Text>
          <TextInput
            onChangeText={(value) => setHeader({ ...header, menu_title: value })}
            placeholder="Nombre en el menú"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.menu_title ?? ""}
          />
          <TextInput
            onChangeText={(value) => setHeader({ ...header, screen_title: value })}
            placeholder="Título de la pantalla"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.screen_title ?? ""}
          />
          <TextInput
            onChangeText={(value) => setHeader({ ...header, week_label: value })}
            placeholder="Semana o fecha"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.week_label ?? ""}
          />
          <TextInput
            multiline
            onChangeText={(value) => setHeader({ ...header, subtitle: value })}
            placeholder="Descripción opcional"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.smallArea]}
            textAlignVertical="top"
            value={header.subtitle ?? ""}
          />
          <View style={styles.setting}>
            <Text style={styles.settingText}>Mostrar apartado en Más</Text>
            <Switch
              onValueChange={(value) => setHeader({ ...header, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={header.is_active}
            />
          </View>
          <Pressable disabled={savingHeader} onPress={saveHeader} style={[styles.button, savingHeader && styles.disabled]}>
            {savingHeader ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar información</Text>}
          </Pressable>
        </View>

        {songForm ? (
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editar canción</Text>
          <TextInput
            onChangeText={(value) => setSongForm({ ...songForm, title: value })}
            placeholder="Nombre de la canción"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={songForm.title}
          />
          <TextInput
            onChangeText={(value) => setSongForm({ ...songForm, artist: value })}
            placeholder="Artista o grupo"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={songForm.artist ?? ""}
          />
          <View style={styles.row}>
            <TextInput
              onChangeText={(value) => setSongForm({ ...songForm, musical_key: value })}
              placeholder="Tonalidad"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.flex]}
              value={songForm.musical_key ?? ""}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => setSongForm({ ...songForm, sort_order: Number.parseInt(value, 10) || 0 })}
              placeholder="Orden"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.flex]}
              value={String(songForm.sort_order)}
            />
          </View>
          <TextInput
            onChangeText={(value) => setSongForm({ ...songForm, reference_url: value })}
            placeholder="Enlace de referencia"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={songForm.reference_url ?? ""}
          />
          <TextInput
            multiline
            onChangeText={(value) => setSongForm({ ...songForm, notes: value })}
            placeholder="Notas para el equipo"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.mediumArea]}
            textAlignVertical="top"
            value={songForm.notes ?? ""}
          />
          <View style={styles.setting}>
            <Text style={styles.settingText}>Canción visible</Text>
            <Switch
              onValueChange={(value) => setSongForm({ ...songForm, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={songForm.is_active}
            />
          </View>
          <Pressable disabled={savingSong} onPress={saveSong} style={[styles.button, savingSong && styles.disabled]}>
            {savingSong ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar canción</Text>}
          </Pressable>
          <Pressable onPress={resetSongForm} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Cancelar edición</Text>
          </Pressable>
        </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repertorio registrado</Text>
          <Text style={styles.helperText}>Las canciones ocultas permanecen guardadas y pueden restaurarse.</Text>
          {songs.map((song) => (
            <View key={song.id} style={[styles.songItem, !song.is_active && styles.inactive]}>
              <Pressable onPress={() => editSong(song)} style={styles.songMain}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{song.sort_order}</Text>
                </View>
                <View style={styles.songText}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songMeta}>
                    {[song.artist, song.musical_key, song.is_active ? "Visible" : "Oculta"].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Ionicons name="pencil" color={colors.gold} size={19} />
              </Pressable>
              <Pressable
                disabled={changingSongId === song.id}
                onPress={() => changeSongState(song)}
                style={[styles.stateButton, song.is_active ? styles.removeButton : styles.restoreButton]}
              >
                {changingSongId === song.id ? (
                  <ActivityIndicator color={song.is_active ? colors.danger : colors.gold} size="small" />
                ) : (
                  <>
                    <Ionicons name={song.is_active ? "trash-outline" : "refresh"} color={song.is_active ? colors.danger : colors.gold} size={17} />
                    <Text style={[styles.stateButtonText, { color: song.is_active ? colors.danger : colors.gold }]}>
                      {song.is_active ? "Quitar" : "Restaurar"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ))}
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
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  helperText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 13, fontFamily: fonts.regular },
  smallArea: { minHeight: 76, paddingTop: 13 },
  mediumArea: { minHeight: 100, paddingTop: 13 },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  setting: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingText: { color: colors.text, fontFamily: fonts.semiBold },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold },
  secondaryButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.textSecondary, fontFamily: fonts.bold },
  songItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 10 },
  inactive: { opacity: 0.68 },
  songMain: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10 },
  orderBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  orderText: { color: colors.gold, fontSize: 13, fontFamily: fonts.black },
  songText: { flex: 1, gap: 3 },
  songTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  songMeta: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular },
  stateButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  removeButton: { borderColor: "rgba(255,90,90,0.35)" },
  restoreButton: { borderColor: colors.gold },
  stateButtonText: { fontSize: 12, fontFamily: fonts.bold }
});
