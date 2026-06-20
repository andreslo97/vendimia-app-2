import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getWeeklySongsData, WeeklySongsData } from "@/services/weeklySongsService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { runRefresh } from "@/utils/refresh";

export default function WeeklySongsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<WeeklySongsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getWeeklySongsData());

  useEffect(() => {
    load()
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(load).finally(() => setRefreshing(false));
  };

  const openReference = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Enlace no disponible", "No fue posible abrir la referencia de esta canción.");
    }
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}
      refreshControl={<RefreshControl colors={[colors.gold]} progressBackgroundColor={colors.cardDark} refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      style={styles.screen}
    >
      <Pressable onPress={() => router.replace("/(tabs)/more" as never)} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      {data?.header ? (
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="musical-notes" color={colors.background} size={24} />
          </View>
          <View style={styles.headerText}>
            {data.header.week_label ? <Text style={styles.weekLabel}>{data.header.week_label}</Text> : null}
            {data.header.screen_title ? <Text style={styles.title}>{data.header.screen_title}</Text> : null}
            {data.header.subtitle ? <Text style={styles.subtitle}>{data.header.subtitle}</Text> : null}
          </View>
        </View>
      ) : null}

      {data?.songs.length ? (
        <View style={styles.list}>
          {data.songs.map((song, index) => (
            <View key={song.id} style={styles.songCard}>
              <View style={styles.songNumber}>
                <Text style={styles.songNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.songContent}>
                <Text style={styles.songTitle}>{song.title}</Text>
                {song.artist ? <Text style={styles.artist}>{song.artist}</Text> : null}
                {song.musical_key ? (
                  <View style={styles.keyBadge}>
                    <Ionicons name="musical-note" color={colors.gold} size={13} />
                    <Text style={styles.keyText}>{song.musical_key}</Text>
                  </View>
                ) : null}
                {song.notes ? <Text style={styles.notes}>{song.notes}</Text> : null}
              </View>
              {song.reference_url ? (
                <Pressable accessibilityLabel={`Abrir referencia de ${song.title}`} onPress={() => openReference(song.reference_url!)} style={styles.linkButton}>
                  <Ionicons name="open-outline" color={colors.gold} size={20} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" color={colors.textSecondary} size={30} />
          <Text style={styles.emptyText}>Aún no hay canciones publicadas para esta semana.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 18 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, flexDirection: "row", alignItems: "flex-start", gap: 14 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1, gap: 5 },
  weekLabel: { color: colors.gold, fontSize: 13, fontFamily: fonts.bold },
  title: { color: colors.text, fontSize: 28, lineHeight: 32, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  list: { gap: 12 },
  songCard: { minHeight: 92, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  songNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  songNumberText: { color: colors.gold, fontSize: 14, fontFamily: fonts.black },
  songContent: { flex: 1, gap: 4 },
  songTitle: { color: colors.text, fontSize: 17, lineHeight: 21, fontFamily: fonts.extraBold },
  artist: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.medium },
  keyBadge: { alignSelf: "flex-start", marginTop: 3, borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 9, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  keyText: { color: colors.gold, fontSize: 11, fontFamily: fonts.bold },
  notes: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: fonts.regular, marginTop: 3 },
  linkButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  empty: { minHeight: 150, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cardDark, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", fontFamily: fonts.regular }
});
