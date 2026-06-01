import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BibleData, BibleVersion, getBibleData } from "@/services/bibleService";
import { colors } from "@/theme/colors";

export default function BibleScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<BibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getBibleData());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load().finally(() => setRefreshing(false));
  };

  const openVersion = (version: BibleVersion) => {
    router.push({
      pathname: "/discipulado/biblia/[id]",
      params: { id: String(version.id) }
    } as never);
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
      <Pressable onPress={() => router.replace("/(tabs)/discipulado")} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      {data?.content ? (
        <View style={styles.header}>
          {data.content.title ? <Text style={styles.title}>{data.content.title}</Text> : null}
          {data.content.subtitle ? <Text style={styles.subtitle}>{data.content.subtitle}</Text> : null}
        </View>
      ) : null}

      {data?.versions.length ? (
        data.versions.map((version) => (
          <Pressable key={version.id} onPress={() => openVersion(version)} style={styles.card}>
            <View style={styles.iconBubble}>
              <Ionicons name="book" color={colors.background} size={24} />
            </View>
            <View style={styles.flex}>
              {version.title ? <Text style={styles.cardTitle}>{version.title}</Text> : null}
              {version.abbreviation ? <Text style={styles.abbreviation}>{version.abbreviation}</Text> : null}
              {version.description ? <Text style={styles.body}>{version.description}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" color={colors.gold} size={22} />
          </Pressable>
        ))
      ) : data?.content?.empty_text ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{data.content.empty_text}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 14 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 31, fontWeight: "900" },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  card: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 14, flexDirection: "row", alignItems: "center" },
  iconBubble: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  abbreviation: { color: colors.gold, fontSize: 12, fontWeight: "800", marginTop: 2 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  emptyCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.line, padding: 18, backgroundColor: colors.cardDark },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }
});
