import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { getLoginErrorMessage } from "@/utils/auth-errors";

const vendimiaLogo = require("@/assets/vendimia-logo-orange.png");

export default function LoginScreen() {
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Redirect href="/(tabs)" />;

  const onSubmit = async () => {
    try {
      setErrorMessage(null);
      setSubmitting(true);
      await signIn(email.trim(), password);
    } catch (error) {
      const message = getLoginErrorMessage(error);
      setErrorMessage(message);
      Alert.alert("Datos incorrectos", message);
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
          <Text style={styles.title}>Mi casa es tu casa</Text>
          <Text style={styles.subtitle}>Bienvenidos</Text>
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
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed" color={colors.gold} size={20} />
            <TextInput
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <Pressable disabled={submitting} onPress={onSubmit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
            {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Ingresar</Text>}
          </Pressable>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tienes cuenta?</Text>
            <Link href="/auth/register" style={styles.link}>
              Crear cuenta
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
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 10
  },
  registerText: {
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
  }
});
