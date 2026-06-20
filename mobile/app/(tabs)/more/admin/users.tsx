import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { AdminUser, getAdminUsers, updateAdminUserPermissions } from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const roles = ["user", "lider", "super_admin"];

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => setUsers(await getAdminUsers());
  useEffect(() => { load().catch(() => undefined); }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => `${user.full_name} ${user.email} ${user.phone_country_code ?? ""}${user.phone_number ?? ""}`.toLowerCase().includes(query));
  }, [search, users]);

  const update = async (user: AdminUser, role = user.role, canManage = user.can_manage_appointments) => {
    try {
      setUpdatingId(user.id);
      await updateAdminUserPermissions(user.id, role, canManage);
      await load();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar el usuario.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (profile?.role !== "super_admin") return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" color={colors.text} size={22} /></Pressable>
      <View style={styles.header}><Text style={styles.title}>Usuarios y roles</Text><Text style={styles.subtitle}>Busca usuarios y administra sus permisos.</Text></View>
      <TextInput onChangeText={setSearch} placeholder="Buscar nombre, correo o teléfono" style={styles.search} value={search} />

      {filtered.map((user) => (
        <View key={user.id} style={styles.card}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}><Ionicons name="person" color={colors.gold} size={20} /></View>
            <View style={styles.userText}><Text style={styles.name}>{user.full_name}</Text><Text style={styles.email}>{user.email}</Text></View>
            {updatingId === user.id ? <ActivityIndicator color={colors.gold} /> : null}
          </View>
          <View style={styles.roles}>
            {roles.map((role) => (
              <Pressable key={role} disabled={updatingId === user.id} onPress={() => update(user, role)} style={[styles.role, user.role === role && styles.roleActive]}>
                <Text style={[styles.roleText, user.role === role && styles.roleTextActive]}>{role}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.setting}>
            <View><Text style={styles.settingTitle}>Gestionar citas</Text><Text style={styles.settingBody}>Puede ver y responder solicitudes pastorales.</Text></View>
            <Switch disabled={updatingId === user.id} onValueChange={(value) => update(user, user.role, value)} thumbColor={colors.text} trackColor={{ false: colors.cardGray, true: colors.gold }} value={user.can_manage_appointments} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 14 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  search: { minHeight: 50, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cardDark, color: colors.text, paddingHorizontal: 14 },
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cardDark, padding: 14, gap: 13 },
  userHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  userText: { flex: 1, gap: 2 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  email: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 11 },
  roles: { flexDirection: "row", gap: 7 },
  role: { flex: 1, minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  roleActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  roleText: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.bold },
  roleTextActive: { color: colors.background },
  setting: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  settingTitle: { color: colors.text, fontSize: 13, fontFamily: fonts.bold },
  settingBody: { color: colors.textSecondary, fontSize: 10, marginTop: 2, maxWidth: 240 }
});
