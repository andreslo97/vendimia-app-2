import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type AdminOption = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const groups: { title: string; options: AdminOption[] }[] = [
  {
    title: "Contenido",
    options: [
      { title: "Inicio", subtitle: "Encabezado, banner y palabra del día", icon: "home", route: "/(tabs)/more/admin/home" },
      { title: "Canción de Inicio", subtitle: "Reproducción completa o con duración personalizada", icon: "play-circle", route: "/(tabs)/more/admin/home-song" },
      { title: "Devocional diario", subtitle: "Publicar y editar el contenido de hoy", icon: "sunny", route: "/(tabs)/more/admin/devotional" },
      { title: "Eventos", subtitle: "Crear, editar, destacar o desactivar", icon: "calendar", route: "/(tabs)/more/admin/events" }
    ]
  },
  {
    title: "Comunidad",
    options: [
      { title: "Usuarios y roles", subtitle: "Roles y permisos para gestionar citas", icon: "people", route: "/(tabs)/more/admin/users" },
      { title: "Citas pastorales", subtitle: "Solicitudes y respuestas pendientes", icon: "chatbubbles", route: "/(tabs)/more/appointment-responses" },
      { title: "Cronograma liderazgo", subtitle: "Programación, responsables y orden del servicio", icon: "list", route: "/(tabs)/more/admin/leadership-schedule" },
      { title: "Canciones semanales", subtitle: "Repertorio, tonalidades y referencias", icon: "musical-notes", route: "/(tabs)/more/admin/weekly-songs" },
      { title: "Contactos de grupos", subtitle: "Responsables, correos y datos de contacto", icon: "people-circle", route: "/(tabs)/more/admin/group-contacts" },
      { title: "Sedes e información", subtitle: "Editar contenido institucional y ubicaciones", icon: "location", route: "/(tabs)/more/admin/church" }
    ]
  },
  {
    title: "Comunicación",
    options: [
      { title: "Notificaciones", subtitle: "Envíos, automatizaciones e historial", icon: "notifications", route: "/(tabs)/more/admin-notifications" }
    ]
  },
  {
    title: "Sistema",
    options: [
      { title: "Estado del sistema", subtitle: "Tokens, trabajos, eventos y pendientes", icon: "pulse", route: "/(tabs)/more/admin/system" }
    ]
  }
];

export default function AdminHubScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  if (profile?.role !== "super_admin") {
    return (
      <View style={styles.restricted}>
        <Ionicons name="lock-closed" color={colors.gold} size={30} />
        <Text style={styles.title}>Acceso restringido</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]} style={styles.screen}>
      <Pressable onPress={() => router.replace("/(tabs)/more" as never)} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Panel admin</Text>
        <Text style={styles.subtitle}>Administra el contenido y operación de la app desde módulos independientes.</Text>
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.options.map((option) => (
            <Pressable key={option.title} onPress={() => router.push(option.route as never)} style={styles.option}>
              <View style={styles.iconWrap}>
                <Ionicons name={option.icon} color={colors.gold} size={23} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.textSecondary} size={20} />
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  restricted: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 12 },
  content: { paddingHorizontal: 20, gap: 20 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  group: { gap: 10 },
  groupTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  option: { minHeight: 72, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1, gap: 3 },
  optionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  optionSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: fonts.regular }
});
