import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { logAdminAction } from "@/services/adminService";
import { supabase } from "@/services/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type ChurchInfoRow = {
  id: number;
  title: string | null;
  subtitle: string | null;
  who_title: string | null;
  who_body: string | null;
  vision_title: string | null;
  vision_body: string | null;
  mission_title: string | null;
  mission_body: string | null;
};

type LocationRow = {
  id: number;
  name: string | null;
  city: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  service_times: string | null;
  maps_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function AdminChurchScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useAuth();
  const [info, setInfo] = useState<ChurchInfoRow | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const [infoResult, locationsResult] = await Promise.all([
      supabase.from("church_info").select("id,title,subtitle,who_title,who_body,vision_title,vision_body,mission_title,mission_body").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("church_locations").select("id,name,city,address_line_1,address_line_2,service_times,maps_url,sort_order,is_active").order("sort_order")
    ]);
    if (infoResult.error) throw infoResult.error;
    if (locationsResult.error) throw locationsResult.error;
    setInfo(infoResult.data);
    setLocations((locationsResult.data ?? []) as LocationRow[]);
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const saveInfo = async () => {
    if (!profile?.id || !info) return;
    const { id, ...payload } = info;
    try {
      setSaving("info");
      const { error } = await supabase.from("church_info").update(payload).eq("id", id);
      if (error) throw error;
      await logAdminAction(profile.id, "church", "update_info", "church_info", id, payload);
      Alert.alert("Información actualizada");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setSaving(null);
    }
  };

  const saveLocation = async () => {
    if (!profile?.id || !editingLocation) return;
    const { id, ...payload } = editingLocation;
    try {
      setSaving("location");
      const { error } = await supabase.from("church_locations").update(payload).eq("id", id);
      if (error) throw error;
      await logAdminAction(profile.id, "church", "update_location", "church_locations", id, payload);
      setEditingLocation(null);
      await load();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar la sede.");
    } finally {
      setSaving(null);
    }
  };

  if (profile?.role !== "super_admin") return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  if (!info) return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" color={colors.text} size={22} /></Pressable>
        <View style={styles.header}><Text style={styles.title}>Sedes e información</Text><Text style={styles.subtitle}>Edita el contenido institucional y los datos de cada sede.</Text></View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la iglesia</Text>
          {(["title", "subtitle", "who_title", "who_body", "vision_title", "vision_body", "mission_title", "mission_body"] as const).map((field) => (
            <TextInput
              key={field}
              multiline={field.endsWith("_body")}
              onChangeText={(value) => setInfo({ ...info, [field]: value })}
              placeholder={field.replaceAll("_", " ")}
              style={[styles.input, field.endsWith("_body") && styles.area]}
              textAlignVertical="top"
              value={info[field] ?? ""}
            />
          ))}
          <Pressable disabled={saving === "info"} onPress={saveInfo} style={styles.button}>{saving === "info" ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar información</Text>}</Pressable>
        </View>

        {editingLocation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Editar sede</Text>
            {(["name", "city", "address_line_1", "address_line_2", "service_times", "maps_url"] as const).map((field) => (
              <TextInput
                key={field}
                multiline={field === "service_times"}
                onChangeText={(value) => setEditingLocation({ ...editingLocation, [field]: value })}
                placeholder={field.replaceAll("_", " ")}
                style={[styles.input, field === "service_times" && styles.area]}
                value={editingLocation[field] ?? ""}
              />
            ))}
            <View style={styles.setting}><Text style={styles.settingText}>Sede activa</Text><Switch onValueChange={(value) => setEditingLocation({ ...editingLocation, is_active: value })} thumbColor={colors.text} trackColor={{ false: colors.cardGray, true: colors.gold }} value={editingLocation.is_active} /></View>
            <Pressable disabled={saving === "location"} onPress={saveLocation} style={styles.button}>{saving === "location" ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar sede</Text>}</Pressable>
            <Pressable onPress={() => setEditingLocation(null)} style={styles.secondary}><Text style={styles.secondaryText}>Cancelar</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sedes</Text>
          {locations.map((location) => (
            <Pressable key={location.id} onPress={() => { setEditingLocation(location); scrollRef.current?.scrollTo({ y: 600, animated: true }); }} style={styles.location}>
              <View style={styles.locationText}><Text style={styles.locationName}>{location.name}</Text><Text style={styles.locationMeta}>{location.city} · {location.is_active ? "Activa" : "Inactiva"}</Text></View>
              <Ionicons name="pencil" color={colors.gold} size={19} />
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
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  section: { padding: 16, gap: 11, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  input: { minHeight: 49, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 13 },
  area: { minHeight: 110, paddingTop: 13 },
  setting: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingText: { color: colors.text, fontFamily: fonts.bold },
  button: { minHeight: 50, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold },
  secondary: { minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.textSecondary, fontFamily: fonts.bold },
  location: { minHeight: 58, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  locationText: { flex: 1, gap: 3 },
  locationName: { color: colors.text, fontFamily: fonts.bold },
  locationMeta: { color: colors.textSecondary, fontSize: 11 }
});
