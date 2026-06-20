import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { getPhoneCountryCodes, normalizePhoneNumber, PhoneCountryCode } from "@/services/phoneCountryService";
import { supabase } from "@/services/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { formatColombiaDateTime } from "@/utils/colombiaDateTime";

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, " ");
const isValidFullName = (value: string) => normalizeFullName(value).split(" ").length >= 2;

type ProfileChangeLog = {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

const fieldLabels: Record<string, string> = {
  full_name: "Nombre",
  email: "Correo",
  phone_country_code: "Pais",
  phone_number: "Teléfono",
  avatar_url: "Foto",
  password: "Contraseña"
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, updateProfileDetails, updateProfileAvatar } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCodes, setPhoneCountryCodes] = useState<PhoneCountryCode[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changeLogs, setChangeLogs] = useState<ProfileChangeLog[]>([]);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setEmail(profile?.email ?? user?.email ?? "");
    setPhoneCountryCode(profile?.phone_country_code ?? "");
    setPhoneNumber(profile?.phone_number ?? "");
  }, [profile?.email, profile?.full_name, profile?.phone_country_code, profile?.phone_number, user?.email]);

  useEffect(() => {
    getPhoneCountryCodes()
      .then((codes) => {
        setPhoneCountryCodes(codes);
        setPhoneCountryCode((current) => current || profile?.phone_country_code || codes[0]?.country_code || "");
      })
      .catch(() => undefined);
  }, [profile?.phone_country_code]);

  const loadChangeLogs = async () => {
    const { data, error } = await supabase
      .from("profile_change_logs")
      .select("id,field_name,old_value,new_value,created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error) setChangeLogs(data ?? []);
  };

  useEffect(() => {
    loadChangeLogs();
  }, []);

  const changeProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos para actualizar tu foto de perfil.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 0.82
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setUploadingAvatar(true);
      await updateProfileAvatar(result.assets[0].uri);
      await loadChangeLogs();
      Alert.alert("Foto actualizada", "Tu foto de perfil fue actualizada correctamente.");
    } catch {
      Alert.alert("Error", "No fue posible actualizar tu foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    const normalizedFullName = normalizeFullName(fullName);
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidFullName(normalizedFullName)) {
      Alert.alert("Nombre completo requerido", "Ingresa tu nombre completo con al menos dos palabras.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    if (!phoneCountryCode || normalizePhoneNumber(phoneNumber).length < 7) {
      Alert.alert("Teléfono requerido", "Selecciona el país e ingresa un teléfono válido.");
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfileDetails(normalizedFullName, normalizedEmail, phoneCountryCode, phoneNumber);
      await loadChangeLogs();
      Alert.alert("Perfil actualizado", "Tu información fue actualizada correctamente.");
    } catch {
      Alert.alert("Error", "No fue posible actualizar tu información.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.replace("/(tabs)/more" as never)} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>

        <View style={styles.header}>
          <Pressable disabled={uploadingAvatar} onPress={changeProfilePhoto} style={styles.avatar}>
            {uploadingAvatar ? (
              <ActivityIndicator color={colors.gold} />
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" color={colors.gold} size={34} />
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" color={colors.background} size={14} />
            </View>
          </Pressable>
          <Text style={styles.title}>Perfil y cuenta</Text>
          <Text style={styles.subtitle}>Actualiza tu información personal y credenciales de acceso.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person" color={colors.gold} size={20} />
            <TextInput autoCapitalize="words" onChangeText={setFullName} placeholder="Nombre completo" style={styles.input} value={fullName} />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="mail" color={colors.gold} size={20} />
            <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Correo" style={styles.input} value={email} />
          </View>
          <View style={styles.countryCodes}>
            {phoneCountryCodes.map((country) => {
              const active = phoneCountryCode === country.country_code;
              return (
                <Pressable key={country.id} onPress={() => setPhoneCountryCode(country.country_code)} style={[styles.countryPill, active && styles.countryPillActive]}>
                  <Text style={[styles.countryPillText, active && styles.countryPillTextActive]}>{country.country_name} {country.country_code}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="call" color={colors.gold} size={20} />
            <TextInput autoComplete="tel" keyboardType="phone-pad" onChangeText={setPhoneNumber} placeholder="Teléfono" style={styles.input} value={phoneNumber} />
          </View>
          <Pressable disabled={savingProfile} onPress={saveProfile} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, savingProfile && styles.buttonDisabled]}>
            {savingProfile ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar información</Text>}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de cambios</Text>
          {changeLogs.length ? (
            changeLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logIcon}>
                  <Ionicons name="time" color={colors.gold} size={16} />
                </View>
                <View style={styles.logBody}>
                  <Text style={styles.logTitle}>{fieldLabels[log.field_name] ?? log.field_name}</Text>
                  <Text style={styles.logDate}>{formatColombiaDateTime(log.created_at)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aún no hay cambios registrados.</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 18 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 92, height: 92, borderRadius: 46 },
  avatarBadge: { position: "absolute", right: 2, bottom: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.background },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.black, textAlign: "center" },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular, textAlign: "center" },
  section: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  inputWrap: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10 },
  input: { flex: 1, minHeight: 54, color: colors.text, fontSize: 16, fontFamily: fonts.regular },
  countryCodes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countryPill: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.background },
  countryPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  countryPillText: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bold },
  countryPillTextActive: { color: colors.background },
  button: { minHeight: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, marginTop: 4 },
  buttonSecondary: { minHeight: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.gold, marginTop: 4 },
  buttonPressed: { opacity: 0.88 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.background, fontSize: 15, fontFamily: fonts.black },
  buttonSecondaryText: { color: colors.gold, fontSize: 15, fontFamily: fonts.black },
  logItem: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  logIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  logBody: { flex: 1 },
  logTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.bold },
  logDate: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular }
});
