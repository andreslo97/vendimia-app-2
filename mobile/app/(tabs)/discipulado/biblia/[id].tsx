import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WebContentViewer } from "@/components/WebContentViewer";
import { BibleVersion, getBibleVersionById } from "@/services/bibleService";
import { colors } from "@/theme/colors";

export default function BibleViewerScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [version, setVersion] = useState<BibleVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const versionId = Number(id);
      if (!versionId) return;
      setVersion(await getBibleVersionById(versionId));
    };

    load()
      .catch((error) => {
        Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar la version.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const openExternal = async () => {
    const url = version?.external_url ?? version?.viewer_url;
    if (url) await Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10, minHeight: insets.top + 64 }]}>
        <Pressable onPress={() => router.replace("/discipulado/biblia" as never)} style={styles.iconButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>
        <View style={styles.titleWrap}>
          {version?.title ? <Text numberOfLines={1} style={styles.title}>{version.title}</Text> : null}
        </View>
        <Pressable disabled={!version} onPress={openExternal} style={styles.iconButton}>
          <Ionicons name="open-outline" color={colors.gold} size={22} />
        </Pressable>
      </View>

      {version?.viewer_url ? <WebContentViewer url={version.viewer_url} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.cardDark },
  iconButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardGray },
  titleWrap: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" }
});
