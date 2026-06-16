import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PdfViewer } from "@/components/PdfViewer";
import { useAuth } from "@/hooks/use-auth";
import { DiscipleshipMaterial, getDiscipleshipMaterialById, getMaterialSignedUrl } from "@/services/discipleshipService";
import { colors } from "@/theme/colors";

const canViewMaterial = (role: string | null | undefined, allowedRole: string) =>
  role === "super_admin" || role === allowedRole;

export default function MaterialViewerScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading: authLoading, profile } = useAuth();
  const [material, setMaterial] = useState<DiscipleshipMaterial | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      const materialId = Number(id);
      if (!materialId) return;

      const nextMaterial = await getDiscipleshipMaterialById(materialId);
      setMaterial(nextMaterial);

      if (!nextMaterial) return;

      if (!canViewMaterial(profile?.role, nextMaterial.allowed_role)) {
        Alert.alert("Acceso restringido", "Necesitas ser líder para ver este contenido.", [
          {
            text: "Aceptar",
            onPress: () => router.replace("/discipulado/material")
          }
        ]);
        return;
      }

      setSignedUrl(await getMaterialSignedUrl(nextMaterial));
    };

    setLoading(true);
    load()
      .catch((error) => {
        Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar el material.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, id, profile?.role]);

  const openExternal = async () => {
    if (signedUrl) await Linking.openURL(signedUrl);
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
        <Pressable onPress={() => router.replace("/discipulado/material")} style={styles.iconButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>
        <View style={styles.titleWrap}>
          {material?.title ? <Text numberOfLines={1} style={styles.title}>{material.title}</Text> : null}
        </View>
        <Pressable disabled={!signedUrl} onPress={openExternal} style={styles.iconButton}>
          <Ionicons name="open-outline" color={colors.gold} size={22} />
        </Pressable>
      </View>

      {signedUrl ? <PdfViewer url={signedUrl} /> : null}
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
