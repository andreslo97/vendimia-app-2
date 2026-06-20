import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { AdminEvent, getAdminEvents, saveAdminEvent } from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const emptyEvent = (): Omit<AdminEvent, "id"> => ({
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  location: "",
  maps_url: "",
  image_url: "",
  show_on_home: false,
  home_sort_order: 0,
  is_active: true
});

export default function AdminEventsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [form, setForm] = useState<Omit<AdminEvent, "id"> & { id?: number }>(emptyEvent());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => setEvents(await getAdminEvents());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const edit = (event: AdminEvent) => {
    setForm(event);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const save = async () => {
    if (!profile?.id || !form.title?.trim() || !form.event_date) {
      Alert.alert("Campos requeridos", "Ingresa título y fecha.");
      return;
    }

    try {
      setSaving(true);
      await saveAdminEvent(profile.id, form);
      setForm(emptyEvent());
      await load();
      Alert.alert("Evento guardado", "Los cambios quedaron disponibles en la app.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  if (profile?.role !== "super_admin") return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" color={colors.text} size={22} /></Pressable>
        <View style={styles.header}>
          <Text style={styles.title}>Eventos</Text>
          <Text style={styles.subtitle}>Crea, edita, destaca o desactiva eventos.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{form.id ? "Editar evento" : "Nuevo evento"}</Text>
          <TextInput onChangeText={(value) => setForm({ ...form, title: value })} placeholder="Título" style={styles.input} value={form.title ?? ""} />
          <TextInput multiline onChangeText={(value) => setForm({ ...form, description: value })} placeholder="Descripción" style={[styles.input, styles.mediumArea]} value={form.description ?? ""} />
          <View style={styles.row}>
            <TextInput onChangeText={(value) => setForm({ ...form, event_date: value })} placeholder="AAAA-MM-DD" style={[styles.input, styles.flex]} value={form.event_date ?? ""} />
            <TextInput onChangeText={(value) => setForm({ ...form, event_time: value })} placeholder="Hora" style={[styles.input, styles.flex]} value={form.event_time ?? ""} />
          </View>
          <TextInput onChangeText={(value) => setForm({ ...form, location: value })} placeholder="Ubicación" style={styles.input} value={form.location ?? ""} />
          <TextInput onChangeText={(value) => setForm({ ...form, maps_url: value })} placeholder="URL Google Maps" style={styles.input} value={form.maps_url ?? ""} />
          <TextInput onChangeText={(value) => setForm({ ...form, image_url: value })} placeholder="URL de imagen" style={styles.input} value={form.image_url ?? ""} />
          <View style={styles.setting}><Text style={styles.settingText}>Mostrar en Inicio</Text><Switch onValueChange={(value) => setForm({ ...form, show_on_home: value })} thumbColor={colors.text} trackColor={{ false: colors.cardGray, true: colors.gold }} value={form.show_on_home} /></View>
          <View style={styles.setting}><Text style={styles.settingText}>Evento activo</Text><Switch onValueChange={(value) => setForm({ ...form, is_active: value })} thumbColor={colors.text} trackColor={{ false: colors.cardGray, true: colors.gold }} value={form.is_active} /></View>
          <Pressable disabled={saving} onPress={save} style={[styles.button, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar evento</Text>}</Pressable>
          {form.id ? <Pressable onPress={() => setForm(emptyEvent())} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar edición</Text></Pressable> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eventos registrados</Text>
          {events.map((event) => (
            <Pressable key={event.id} onPress={() => edit(event)} style={styles.item}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{event.title}</Text>
                <Text style={styles.itemMeta}>{event.event_date} · {event.event_time || "Sin hora"} · {event.is_active ? "Activo" : "Inactivo"}</Text>
              </View>
              <Ionicons name="pencil" color={colors.gold} size={20} />
            </Pressable>
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
  subtitle: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular },
  section: { padding: 16, gap: 12, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 13 },
  mediumArea: { minHeight: 90, paddingTop: 13 },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  setting: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingText: { color: colors.text, fontFamily: fonts.semiBold },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold },
  secondaryButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.textSecondary, fontFamily: fonts.bold },
  item: { minHeight: 62, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  itemText: { flex: 1, gap: 3 },
  itemTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  itemMeta: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 11 }
});
