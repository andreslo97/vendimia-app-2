import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChurchInfo, getChurchInfo } from "@/services/churchInfoService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const vendimiaLogo = require("@/assets/vendimia-logo-orange.png");

export default function ChurchInfoScreen() {
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<ChurchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setInfo(await getChurchInfo());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load().finally(() => setRefreshing(false));
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      style={styles.screen}
    >
      <Pressable onPress={() => router.replace("/(tabs)/more")} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      {info ? (
        <>
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Image source={vendimiaLogo} style={styles.logoImage} />
            </View>
            {info.title ? <Text style={styles.title}>{info.title}</Text> : null}
            {info.subtitle ? <Text style={styles.subtitle}>{info.subtitle}</Text> : null}
          </View>

          <InfoSection title={info.who_title} body={info.who_body} icon="people" />
          <InfoSection title={info.vision_title} body={info.vision_body} icon="eye" />
          <InfoSection title={info.mission_title} body={info.mission_body} icon="navigate" />
        </>
      ) : null}
    </ScrollView>
  );
}

function InfoSection({ title, body, icon }: { title: string | null; body: string | null; icon: keyof typeof Ionicons.glyphMap }) {
  if (!title && !body) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBubble}>
          <Ionicons name={icon} color={colors.background} size={22} />
        </View>
        {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      </View>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { alignItems: "center", gap: 6, marginBottom: 4 },
  logoMark: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 58, height: 58, resizeMode: "cover" },
  title: { color: colors.text, fontSize: 31, fontFamily: fonts.black, textAlign: "center" },
  subtitle: { color: colors.textSecondary, fontSize: 15, fontFamily: fonts.regular, textAlign: "center", lineHeight: 21 },
  card: { borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBubble: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.extraBold, flex: 1 },
  body: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, lineHeight: 22 }
});
