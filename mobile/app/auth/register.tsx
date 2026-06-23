import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { getPhoneCountryCodes, normalizePhoneNumber, PhoneCountryCode } from "@/services/phoneCountryService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { getRegisterErrorMessage } from "@/utils/auth-errors";

const vendimiaLogo = require("@/assets/vendimia-logo-orange.png");
const registrationSuccessMessage = "Registro exitoso. Te enviamos un correo confirmando la creación de tu cuenta.";
const fullNameValidationMessage = "Ingresa tu nombre completo con al menos dos palabras.";

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, " ");

const isValidFullName = (value: string) => normalizeFullName(value).split(" ").length >= 2;

export default function RegisterScreen() {
  const { signUp, session, profile, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneCountryCodes, setPhoneCountryCodes] = useState<PhoneCountryCode[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPhoneCountryCodes()
      .then((codes) => {
        setPhoneCountryCodes(codes);
        setPhoneCountryCode((current) => current || codes[0]?.country_code || "");
      })
      .catch(() => undefined);
  }, []);

  if (!loading && session) {
    if (profile && (!profile.church_attendance_time?.trim() || profile.is_being_discipled === null)) {
      return <Redirect href="/auth/onboarding" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  const selectProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos para agregar tu foto de perfil.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 0.82
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "No fue posible seleccionar la foto.");
    }
  };

  const onSubmit = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSubmitting(true);

      const normalizedFullName = normalizeFullName(fullName);

      if (!isValidFullName(normalizedFullName)) {
        setErrorMessage(fullNameValidationMessage);
        Alert.alert("Nombre completo requerido", fullNameValidationMessage);
        return;
      }

      if (!phoneCountryCode || normalizePhoneNumber(phoneNumber).length < 7) {
        setErrorMessage("Ingresa un teléfono válido.");
        Alert.alert("Teléfono requerido", "Selecciona el país e ingresa tu número de teléfono.");
        return;
      }

      await signUp(normalizedFullName, email.trim(), password, phoneCountryCode, phoneNumber, avatarUri ?? undefined);
      setSuccessMessage(registrationSuccessMessage);
      Alert.alert("Registro exitoso", registrationSuccessMessage, [
        {
          text: "Aceptar",
          onPress: () => router.replace("/auth/login")
        }
      ]);
    } catch (error) {
      const message = getRegisterErrorMessage(error);
      setErrorMessage(message);
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image source={vendimiaLogo} style={styles.logo} />
          </View>
          <Text style={styles.brand}>Iglesia Vendimia Internacional</Text>
          <Text style={styles.title}>Mi casa es tu casa</Text>
          <Text style={styles.subtitle}>Bienvenidos</Text>
        </View>

        <View style={styles.panel}>
          <Pressable onPress={selectProfilePhoto} style={styles.avatarPicker}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" color={colors.gold} size={28} />
              </View>
            )}
            <Text style={styles.avatarText}>{avatarUri ? "Cambiar foto de perfil" : "Agregar foto de perfil (opcional)"}</Text>
          </Pressable>

          <View style={styles.inputWrap}>
            <Ionicons name="person" color={colors.gold} size={20} />
            <TextInput
              autoCapitalize="words"
              onChangeText={setFullName}
              placeholder="Nombre completo"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={fullName}
            />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="mail" color={colors.gold} size={20} />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Correo"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={email}
            />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="call" color={colors.gold} size={20} />
            <Pressable onPress={() => setCountryPickerOpen(true)} style={styles.countrySelect}>
              <Text style={styles.countrySelectText}>{phoneCountryCode || "+00"}</Text>
              <Ionicons name="chevron-down" color={colors.text} size={16} />
            </Pressable>
            <TextInput
              autoComplete="tel"
              keyboardType="phone-pad"
              onChangeText={setPhoneNumber}
              placeholder="Teléfono"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={phoneNumber}
            />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed" color={colors.gold} size={20} />
            <TextInput
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
            />
            <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} color={colors.text} size={22} />
            </Pressable>
          </View>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          <Pressable disabled={submitting} onPress={onSubmit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
            {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
          </Pressable>
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
            <Link href="/auth/login" style={styles.link}>
              Ingresar
            </Link>
          </View>
        </View>
      </ScrollView>

      <Modal animationType="fade" onRequestClose={() => setCountryPickerOpen(false)} transparent visible={countryPickerOpen}>
        <Pressable onPress={() => setCountryPickerOpen(false)} style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Selecciona el país</Text>
            <ScrollView style={styles.modalList}>
              {phoneCountryCodes.map((country) => (
                <Pressable
                  key={country.id}
                  onPress={() => {
                    setPhoneCountryCode(country.country_code);
                    setCountryPickerOpen(false);
                  }}
                  style={styles.countryOption}
                >
                  <Text style={styles.countryOptionText}>{country.country_name}</Text>
                  <Text style={styles.countryOptionCode}>{country.country_code}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 26
  },
  header: {
    alignItems: "center",
    gap: 8
  },
  logoWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: "hidden",
    marginBottom: 4
  },
  logo: {
    width: 82,
    height: 82,
    resizeMode: "cover"
  },
  brand: {
    color: colors.text,
    fontSize: 30,
    fontFamily: fonts.black,
    textAlign: "center"
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    textAlign: "center"
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: "center"
  },
  panel: {
    gap: 14
  },
  avatarPicker: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 2
  },
  avatarPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cardDark,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarPreview: {
    width: 82,
    height: 82,
    borderRadius: 41
  },
  avatarText: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.bold
  },
  inputWrap: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cardDark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10
  },
  input: {
    flex: 1,
    minHeight: 54,
    color: colors.text,
    fontSize: 16
  },
  eyeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  countrySelect: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 4
  },
  countrySelectText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.66)",
    justifyContent: "center",
    padding: 22
  },
  modalPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cardDark,
    padding: 14,
    gap: 6
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.extraBold,
    marginBottom: 4
  },
  modalList: {
    maxHeight: 360
  },
  countryOption: {
    minHeight: 48,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: colors.background
  },
  countryOptionText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold
  },
  countryOptionCode: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.black
  },
  button: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
    marginTop: 6
  },
  buttonPressed: {
    opacity: 0.88
  },
  buttonDisabled: {
    opacity: 0.72
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontFamily: fonts.black
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 10
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular
  },
  link: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.bold
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium
  },
  successText: {
    color: colors.gold,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium
  }
});
