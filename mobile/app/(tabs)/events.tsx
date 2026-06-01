import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventItem } from "@/services/homeService";
import { supabase } from "@/services/supabase";
import { colors } from "@/theme/colors";

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,description,event_date,event_time,location,maps_url")
      .eq("is_active", true)
      .order("event_date", { ascending: true });
    if (error) throw error;
    setItems(data ?? []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load().finally(() => setRefreshing(false));
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      style={styles.screen}
    >
      {items.map((item, index) => (
        <Pressable key={`${item.id ?? item.title}-${index}`} disabled={!item.maps_url} onPress={() => openMaps(item.maps_url)} style={styles.card}>
          {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
          {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
          <View style={styles.metaRow}>
            {item.event_date ? <Text style={styles.meta}>{item.event_date}</Text> : null}
            {item.event_time ? <Text style={styles.meta}>{item.event_time}</Text> : null}
          </View>
          {item.location ? <Text style={styles.meta}>{item.location}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 12 },
  card: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  meta: { color: colors.gold, fontSize: 13, fontWeight: "700" }
});
