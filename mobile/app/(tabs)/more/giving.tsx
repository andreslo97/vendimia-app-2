import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getGivingAccount, GivingAccount } from "@/services/givingAccountService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { runRefresh } from "@/utils/refresh";

export default function GivingScreen() {
  const insets = useSafeAreaInsets();
  const [account, setAccount] = useState<GivingAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setAccount(await getGivingAccount());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(load).finally(() => setRefreshing(false));
  };

  const copyAccountNumber = async () => {
    if (!account?.account_number) return;

    await Clipboard.setStringAsync(account.account_number);
    Alert.alert("Cuenta copiada", "El número de cuenta fue copiado correctamente.");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}
      refreshControl={<RefreshControl colors={[colors.gold]} progressBackgroundColor={colors.cardDark} refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      style={styles.screen}
    >
      <Pressable onPress={() => router.replace("/(tabs)/more")} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      {account ? (
        <>
          <View style={styles.header}>
            {account.screen_title ? <Text style={styles.title}>{account.screen_title}</Text> : null}
            {account.subtitle ? <Text style={styles.subtitle}>{account.subtitle}</Text> : null}
          </View>

          <View style={styles.card}>
            {account.qr_image_url ? (
              <View style={styles.qrWrap}>
                <Image resizeMode="contain" source={{ uri: account.qr_image_url }} style={styles.qrImage} />
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" color={colors.gold} size={52} />
              </View>
            )}

            <View style={styles.infoList}>
              {[account.account_type, account.bank_name].filter(Boolean).length ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{account.account_type}</Text>
                  <Text style={styles.value}>{account.bank_name}</Text>
                </View>
              ) : null}

              {account.account_number ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Cuenta</Text>
                  <View style={styles.copyRow}>
                    <Text style={styles.value}>{account.account_number}</Text>
                    <Pressable accessibilityLabel="Copiar número de cuenta" onPress={copyAccountNumber} style={styles.copyButton}>
                      <Ionicons name="copy" color={colors.background} size={17} />
                      <Text style={styles.copyText}>Copiar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {account.tax_id_value ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{account.tax_id_label}</Text>
                  <Text style={styles.value}>{account.tax_id_value}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { borderRadius: 18, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 6 },
  title: { color: colors.gold, fontSize: 31, lineHeight: 36, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: fonts.medium },
  card: { borderRadius: 18, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 18 },
  qrWrap: { borderRadius: 18, backgroundColor: colors.text, padding: 14, alignItems: "center", justifyContent: "center" },
  qrImage: { width: "100%", aspectRatio: 1, borderRadius: 12 },
  qrPlaceholder: { aspectRatio: 1, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  infoList: { gap: 10 },
  infoRow: { borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  label: { color: colors.gold, fontSize: 12, fontFamily: fonts.bold },
  value: { flex: 1, color: colors.text, fontSize: 19, lineHeight: 24, fontFamily: fonts.extraBold },
  copyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  copyButton: { minHeight: 36, borderRadius: 10, backgroundColor: colors.gold, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  copyText: { color: colors.background, fontSize: 12, fontFamily: fonts.extraBold }
});
