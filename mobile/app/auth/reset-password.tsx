import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/services/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const vendimiaLogo = require("@/assets/vendimia-logo-orange.png");

const getUrlParams = (url: string) => {
  const parsedUrl = new URL(url);
  const queryParams = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace("#", ""));

  return {
    code: queryParams.get("code") ?? hashParams.get("code"),
    accessToken: queryParams.get("access_token") ?? hashParams.get("access_token"),
    refreshToken: queryParams.get("refresh_token") ?? hashParams.get("refresh_token"),
    type: queryParams.get("type") ?? hashParams.get("type")
  };
};

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hydrateRecoverySession = async (url: string | null) => {
      try {
        if (!url) {
          setReady(true);
          return;
        }

        const { code, accessToken, refreshToken, type } = getUrlParams(url);

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (type === "recovery" && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (error) throw error;
        }
      } catch {
        setErrorMessage("El enlace no es válido o ya expiró. Solicita un nuevo correo de recuperación.");
      } finally {
        setReady(true);
      }
    };

    Linking.getInitialURL().then(hydrateRecoverySession);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      hydrateRecoverySession(url);
    });

    return () => subscription.remove();
  }, []);

  const onSubmit = async () => {
    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      setErrorMessage(null);
      setSubmitting(true);
      await updatePassword(password);
      Alert.alert("Contraseña actualizada", "Ya puedes iniciar sesión con tu nueva contraseña.", [
        {
          text: "Aceptar",
          onPress: () => router.replace("/auth/login")
        }
      ]);
    } catch {
      const errorText = "No pudimos actualizar la contraseña. Solicita un nuevo enlace e intenta nuevamente.";
      setErrorMessage(errorText);
      Alert.alert("Error", errorText);
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
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Crea una contraseña segura para tu cuenta</Text>
        </View>

        <View style={styles.panel}>
          {!ready ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : (
            <>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed" color={colors.gold} size={20} />
                <TextInput
                  onChangeText={setPassword}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed" color={colors.gold} size={20} />
                <TextInput
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                />
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <Pressable disabled={submitting} onPress={onSubmit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
                {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar contraseña</Text>}
              </Pressable>
            </>
          )}
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
  loadingCard: {
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cardDark,
    alignItems: "center",
    justifyContent: "center"
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
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium
  }
});
