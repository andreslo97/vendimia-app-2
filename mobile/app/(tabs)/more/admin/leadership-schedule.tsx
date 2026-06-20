import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import {
  AdminLeadershipHeader,
  AdminLeadershipItem,
  getAdminLeadershipSchedule,
  saveAdminLeadershipHeader,
  saveAdminLeadershipItem,
  setAdminLeadershipItemActive
} from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const emptyHeader = (): Omit<AdminLeadershipHeader, "id"> => ({
  menu_title: "Cronograma Liderazgo",
  screen_title: "",
  side_label: "",
  subtitle: "",
  is_active: true
});

const emptyItem = (sortOrder: number): Omit<AdminLeadershipItem, "id"> => ({
  title: "",
  description: "",
  sort_order: sortOrder,
  is_active: true
});

export default function AdminLeadershipScheduleScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useAuth();
  const [header, setHeader] = useState<Omit<AdminLeadershipHeader, "id"> & { id?: number }>(emptyHeader());
  const [items, setItems] = useState<AdminLeadershipItem[]>([]);
  const [itemForm, setItemForm] = useState<Omit<AdminLeadershipItem, "id"> & { id?: number }>(emptyItem(1));
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [changingItemId, setChangingItemId] = useState<number | null>(null);

  const load = async () => {
    const data = await getAdminLeadershipSchedule();
    setHeader(data.header ?? emptyHeader());
    setItems(data.items);
    setItemForm((current) =>
      current.id
        ? current
        : emptyItem(Math.max(0, ...data.items.map((item) => item.sort_order)) + 1)
    );
  };

  useEffect(() => {
    load()
      .catch((error) => Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar el cronograma."))
      .finally(() => setLoading(false));
  }, []);

  const saveHeader = async () => {
    if (!profile?.id || !header.menu_title?.trim() || !header.screen_title?.trim()) {
      Alert.alert("Campos requeridos", "Ingresa el nombre del menú y el título del cronograma.");
      return;
    }

    try {
      setSavingHeader(true);
      await saveAdminLeadershipHeader(profile.id, header);
      await load();
      Alert.alert("Encabezado guardado", "El cronograma quedó actualizado.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar el encabezado.");
    } finally {
      setSavingHeader(false);
    }
  };

  const editItem = (item: AdminLeadershipItem) => {
    setItemForm(item);
    scrollRef.current?.scrollTo({ y: 470, animated: true });
  };

  const resetItemForm = () => {
    setItemForm(emptyItem(Math.max(0, ...items.map((item) => item.sort_order)) + 1));
  };

  const saveItem = async () => {
    if (!profile?.id || !itemForm.title?.trim()) {
      Alert.alert("Campo requerido", "Ingresa el nombre de la responsabilidad.");
      return;
    }

    try {
      setSavingItem(true);
      await saveAdminLeadershipItem(profile.id, itemForm);
      await load();
      resetItemForm();
      Alert.alert("Responsabilidad guardada", "Los cambios ya están disponibles.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar la responsabilidad.");
    } finally {
      setSavingItem(false);
    }
  };

  const changeItemState = (item: AdminLeadershipItem) => {
    const nextActive = !item.is_active;
    Alert.alert(
      nextActive ? "Restaurar responsabilidad" : "Quitar del cronograma",
      nextActive
        ? `¿Deseas volver a mostrar "${item.title}"?`
        : `Se ocultará "${item.title}" de la app, pero permanecerá guardado en la base de datos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: nextActive ? "Restaurar" : "Quitar",
          style: nextActive ? "default" : "destructive",
          onPress: async () => {
            if (!profile?.id) return;
            try {
              setChangingItemId(item.id);
              await setAdminLeadershipItemActive(profile.id, item, nextActive);
              await load();
              if (itemForm.id === item.id) resetItemForm();
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar el estado.");
            } finally {
              setChangingItemId(null);
            }
          }
        }
      ]
    );
  };

  if (profile?.role !== "super_admin") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Acceso restringido</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.text} size={22} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Cronograma liderazgo</Text>
          <Text style={styles.subtitle}>Actualiza la programación y sus responsables sin modificar directamente la base de datos.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Encabezado</Text>
          <TextInput
            onChangeText={(value) => setHeader({ ...header, menu_title: value })}
            placeholder="Nombre en el menú"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.menu_title ?? ""}
          />
          <TextInput
            onChangeText={(value) => setHeader({ ...header, screen_title: value })}
            placeholder="Título del cronograma"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.screen_title ?? ""}
          />
          <TextInput
            onChangeText={(value) => setHeader({ ...header, side_label: value })}
            placeholder="Fecha o etiqueta, por ejemplo: 30 NOV"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.side_label ?? ""}
          />
          <TextInput
            multiline
            onChangeText={(value) => setHeader({ ...header, subtitle: value })}
            placeholder="Subtítulo opcional"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.smallArea]}
            textAlignVertical="top"
            value={header.subtitle ?? ""}
          />
          <View style={styles.setting}>
            <Text style={styles.settingText}>Cronograma visible</Text>
            <Switch
              onValueChange={(value) => setHeader({ ...header, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={header.is_active}
            />
          </View>
          <Pressable disabled={savingHeader} onPress={saveHeader} style={[styles.button, savingHeader && styles.disabled]}>
            {savingHeader ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar encabezado</Text>}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{itemForm.id ? "Editar responsabilidad" : "Nueva responsabilidad"}</Text>
          <TextInput
            onChangeText={(value) => setItemForm({ ...itemForm, title: value })}
            placeholder="Área o responsabilidad"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={itemForm.title ?? ""}
          />
          <TextInput
            multiline
            onChangeText={(value) => setItemForm({ ...itemForm, description: value })}
            placeholder="Responsables o descripción"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.mediumArea]}
            textAlignVertical="top"
            value={itemForm.description ?? ""}
          />
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => setItemForm({ ...itemForm, sort_order: Number.parseInt(value, 10) || 0 })}
            placeholder="Orden"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={String(itemForm.sort_order)}
          />
          <View style={styles.setting}>
            <Text style={styles.settingText}>Responsabilidad visible</Text>
            <Switch
              onValueChange={(value) => setItemForm({ ...itemForm, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={itemForm.is_active}
            />
          </View>
          <Pressable disabled={savingItem} onPress={saveItem} style={[styles.button, savingItem && styles.disabled]}>
            {savingItem ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar responsabilidad</Text>}
          </Pressable>
          {itemForm.id ? (
            <Pressable onPress={resetItemForm} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Cancelar edición</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programación registrada</Text>
          <Text style={styles.helperText}>Los elementos inactivos permanecen en la base de datos y pueden restaurarse.</Text>
          {items.map((item) => (
            <View key={item.id} style={[styles.item, !item.is_active && styles.itemInactive]}>
              <Pressable onPress={() => editItem(item)} style={styles.itemMain}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{item.sort_order}</Text>
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{item.title || "Sin título"}</Text>
                  {item.description ? <Text numberOfLines={2} style={styles.itemDescription}>{item.description}</Text> : null}
                  <Text style={styles.itemMeta}>{item.is_active ? "Visible" : "Oculto"}</Text>
                </View>
                <Ionicons name="pencil" color={colors.gold} size={19} />
              </Pressable>
              <Pressable
                disabled={changingItemId === item.id}
                onPress={() => changeItemState(item)}
                style={[styles.stateButton, item.is_active ? styles.removeButton : styles.restoreButton]}
              >
                {changingItemId === item.id ? (
                  <ActivityIndicator color={item.is_active ? colors.danger : colors.gold} size="small" />
                ) : (
                  <>
                    <Ionicons name={item.is_active ? "trash-outline" : "refresh"} color={item.is_active ? colors.danger : colors.gold} size={17} />
                    <Text style={[styles.stateButtonText, { color: item.is_active ? colors.danger : colors.gold }]}>
                      {item.is_active ? "Quitar" : "Restaurar"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 18 },
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  section: { padding: 16, gap: 12, borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.extraBold },
  helperText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 13, fontFamily: fonts.regular },
  smallArea: { minHeight: 76, paddingTop: 13 },
  mediumArea: { minHeight: 100, paddingTop: 13 },
  setting: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingText: { color: colors.text, fontFamily: fonts.semiBold },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold },
  secondaryButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.textSecondary, fontFamily: fonts.bold },
  item: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 10 },
  itemInactive: { opacity: 0.68 },
  itemMain: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 10 },
  orderBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  orderText: { color: colors.gold, fontSize: 13, fontFamily: fonts.black },
  itemText: { flex: 1, gap: 3 },
  itemTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  itemDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },
  itemMeta: { color: colors.gold, fontSize: 11, fontFamily: fonts.bold },
  stateButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  removeButton: { borderColor: "rgba(255,90,90,0.35)" },
  restoreButton: { borderColor: colors.gold },
  stateButtonText: { fontSize: 12, fontFamily: fonts.bold }
});
