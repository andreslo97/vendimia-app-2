import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { DiscipleshipMaterial, getDiscipleshipMaterials } from "@/services/discipleshipService";
import { colors } from "@/theme/colors";

const canViewLeadershipMaterial = (role?: string | null) => role === "lider" || role === "super_admin";

export default function MaterialScreen() {
  const insets = useSafeAreaInsets();
  const { loading: authLoading, profile } = useAuth();
  const [materials, setMaterials] = useState<DiscipleshipMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setMaterials(await getDiscipleshipMaterials());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load().finally(() => setRefreshing(false));
  };

  if (loading || authLoading) {
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

      {canViewLeadershipMaterial(profile?.role) ? (
        materials.map((material) => (
          <Pressable
            key={material.id}
            onPress={() =>
              router.push({
                pathname: "/discipulado/material/[id]",
                params: { id: String(material.id) }
              } as never)
            }
            style={styles.card}
          >
            <View style={styles.iconBubble}>
              <Ionicons name="document-text" color={colors.background} size={24} />
            </View>
            <View style={styles.flex}>
              {material.title ? <Text style={styles.title}>{material.title}</Text> : null}
              {material.description ? <Text style={styles.body}>{material.description}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" color={colors.gold} size={22} />
          </Pressable>
        ))
      ) : (
        <View style={styles.restrictedCard}>
          <View style={styles.restrictedIcon}>
            <Ionicons name="lock-closed" color={colors.gold} size={24} />
          </View>
          <Text style={styles.restrictedTitle}>Necesitas ser líder para ver este contenido.</Text>
          <Text style={styles.restrictedBody}>Si crees que deberías tener acceso, contacta al equipo de la iglesia para revisar tu perfil.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 14 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  card: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 14, flexDirection: "row", alignItems: "center" },
  iconBubble: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  restrictedCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 20, gap: 10, alignItems: "center" },
  restrictedIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  restrictedTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "800", textAlign: "center" },
  restrictedBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center" }
});
