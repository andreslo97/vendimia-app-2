import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChurchLocationsData, getChurchLocationsData } from "@/services/churchLocationsService";
import { colors } from "@/theme/colors";
import { runRefresh } from "@/utils/refresh";
import { fonts } from "@/theme/fonts";

export default function ChurchLocationsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ChurchLocationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getChurchLocationsData());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(load).finally(() => setRefreshing(false));
  };

  const openMaps = async (url?: string | null) => {
    if (!url) return;
    await Linking.openURL(url);
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

      {data?.header ? (
        <View style={styles.header}>
          {data.header.menu_title ? <Text style={styles.kicker}>{data.header.menu_title}</Text> : null}
          {data.header.screen_title ? <Text style={styles.title}>{data.header.screen_title}</Text> : null}
          {data.header.subtitle ? <Text style={styles.subtitle}>{data.header.subtitle}</Text> : null}
        </View>
      ) : null}

      {data?.locations.length ? (
        <View style={styles.list}>
          {data.locations.map((location) => (
            <Pressable key={location.id} disabled={!location.maps_url} onPress={() => openMaps(location.maps_url)} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBubble}>
                  <Ionicons name="location" color={colors.background} size={22} />
                </View>
                <View style={styles.cardTitleWrap}>
                  {location.name ? <Text style={styles.cardTitle}>{location.name}</Text> : null}
                  {location.city ? <Text style={styles.city}>{location.city}</Text> : null}
                </View>
                {location.maps_url ? <Ionicons name="open-outline" color={colors.gold} size={21} /> : null}
              </View>

              {location.address_line_1 || location.address_line_2 ? (
                <View style={styles.infoBlock}>
                  <Ionicons name="navigate" color={colors.textSecondary} size={17} />
                  <View style={styles.infoTextWrap}>
                    {location.address_line_1 ? <Text style={styles.infoText}>{location.address_line_1}</Text> : null}
                    {location.address_line_2 ? <Text style={styles.infoText}>{location.address_line_2}</Text> : null}
                  </View>
                </View>
              ) : null}

              {location.service_times ? (
                <View style={styles.infoBlock}>
                  <Ionicons name="time" color={colors.textSecondary} size={17} />
                  <Text style={styles.infoText}>{location.service_times}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { borderRadius: 18, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 5 },
  kicker: { color: colors.gold, fontSize: 13, fontFamily: fonts.bold },
  title: { color: colors.text, fontSize: 32, lineHeight: 36, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: fonts.medium },
  list: { gap: 12 },
  card: { borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBubble: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 19, lineHeight: 23, fontFamily: fonts.extraBold },
  city: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium, marginTop: 2 },
  infoBlock: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  infoTextWrap: { flex: 1, gap: 3 },
  infoText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontFamily: fonts.medium }
});
