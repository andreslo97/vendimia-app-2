import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiscipleshipData, getDiscipleshipData } from "@/services/discipleshipService";
import { colors } from "@/theme/colors";

export default function DiscipleshipScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DiscipleshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getDiscipleshipData());

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
      {data?.header ? (
        <View style={styles.header}>
          {data.header.app_label ? <Text style={styles.appLabel}>{data.header.app_label}</Text> : null}
          {data.header.title ? <Text style={styles.title}>{data.header.title}</Text> : null}
          {data.header.subtitle ? <Text style={styles.subtitle}>{data.header.subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={styles.grid}>
        {data?.modules.map((item, index) => (
          <Pressable
            key={`${item.title}-${index}`}
            onPress={() => item.route && router.push(item.route as never)}
            style={[styles.moduleCard, { backgroundColor: item.background_color ?? colors.cardDark }]}
          >
            <View style={[styles.iconBubble, { backgroundColor: item.accent_color ?? colors.gold }]}>
              <Ionicons name={(item.icon_name ?? "book") as keyof typeof Ionicons.glyphMap} color={colors.background} size={22} />
            </View>
            {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
            {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 18 },
  header: { gap: 6 },
  appLabel: { color: colors.gold, fontSize: 13, fontWeight: "700" },
  title: { color: colors.text, fontSize: 31, fontWeight: "900" },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  grid: { gap: 12 },
  moduleCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 10 },
  iconBubble: { width: 42, height: 42, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }
});
