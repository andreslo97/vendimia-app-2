import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const vendimiaLogo = require("@/assets/vendimia-logo-orange.png");
const successMessage = "Te enviamos un correo con las instrucciones para restablecer tu contraseña.";

export default function ForgotPasswordScreen() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    try {
      setMessage(null);
      setErrorMessage(null);
      setSubmitting(true);
      await resetPasswordForEmail(email.trim());
      setMessage(successMessage);
      Alert.alert("Correo enviado", successMessage);
    } catch {
      const errorText = "No pudimos enviar el correo. Revisa el correo ingresado e intenta nuevamente.";
      setErrorMessage(errorText);
      Alert.alert("Error", errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image source={vendimiaLogo} style={styles.logo} />
          </View>
          <Text style={styles.brand}>Iglesia Vendimia Internacional</Text>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>Recibirás un enlace seguro en tu correo</Text>
        </View>

        <View style={styles.panel}>
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

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          <Pressable disabled={submitting} onPress={onSubmit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
            {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Enviar correo</Text>}
          </Pressable>

          <View style={styles.loginRow}>
            <Link href="/auth/login" style={styles.link}>
              Volver al inicio de sesión
            </Link>
          </View>
        </View>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10
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
