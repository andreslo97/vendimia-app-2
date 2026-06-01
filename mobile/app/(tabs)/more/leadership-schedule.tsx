import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getLeadershipScheduleData, LeadershipScheduleData } from "@/services/leadershipScheduleService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function LeadershipScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<LeadershipScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getLeadershipScheduleData());

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

      {data?.header ? (
        <View style={styles.wrapper}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {data.header.menu_title ? <Text style={styles.kicker}>{data.header.menu_title}</Text> : null}
              {data.header.screen_title ? <Text style={styles.title}>{data.header.screen_title}</Text> : null}
              {data.header.subtitle ? <Text style={styles.subtitle}>{data.header.subtitle}</Text> : null}
            </View>
            {data.header.side_label ? (
              <View style={styles.dateChip}>
                <Ionicons name="calendar" color={colors.background} size={16} />
                <Text style={styles.dateText}>{data.header.side_label}</Text>
              </View>
            ) : null}
          </View>

          {data.items.length ? (
            <View style={styles.list}>
              {data.items.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.itemCard}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.itemCopy}>
                    {item.title ? <Text style={styles.itemTitle}>{item.title}</Text> : null}
                    {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
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
  wrapper: { gap: 16 },
  header: { borderRadius: 18, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 14 },
  headerCopy: { gap: 5 },
  kicker: { color: colors.gold, fontSize: 13, fontFamily: fonts.bold },
  title: { color: colors.text, fontSize: 32, lineHeight: 36, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: fonts.medium },
  dateChip: { alignSelf: "flex-start", minHeight: 34, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  dateText: { color: colors.background, fontSize: 13, fontFamily: fonts.black },
  list: { gap: 12 },
  itemCard: { borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: "row", gap: 12 },
  itemNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  itemNumberText: { color: colors.background, fontSize: 14, fontFamily: fonts.black },
  itemCopy: { flex: 1, gap: 3 },
  itemTitle: { color: colors.text, fontSize: 18, lineHeight: 22, fontFamily: fonts.extraBold },
  itemDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.medium }
});
