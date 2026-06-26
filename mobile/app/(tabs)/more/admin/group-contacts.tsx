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
  AdminChurchGroupContact,
  AdminChurchGroupContactsHeader,
  getAdminChurchGroupContacts,
  saveAdminChurchGroupContact,
  saveAdminChurchGroupContactsHeader,
  setAdminChurchGroupContactActive
} from "@/services/adminService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const emptyHeader = (): Omit<AdminChurchGroupContactsHeader, "id"> => ({
  menu_title: "Contactos de grupos",
  screen_title: "Contactos de grupos",
  subtitle: "Encuentra a la persona encargada de cada grupo o ministerio de la iglesia.",
  is_active: true
});

const emptyContact = (sortOrder: number): Omit<AdminChurchGroupContact, "id"> => ({
  group_name: "",
  contact_name: "",
  email: "",
  phone: "",
  notes: "",
  sort_order: sortOrder,
  is_active: true
});

export default function AdminGroupContactsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useAuth();
  const [header, setHeader] = useState<Omit<AdminChurchGroupContactsHeader, "id"> & { id?: number }>(emptyHeader());
  const [contacts, setContacts] = useState<AdminChurchGroupContact[]>([]);
  const [contactForm, setContactForm] = useState<Omit<AdminChurchGroupContact, "id"> & { id?: number }>(emptyContact(1));
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [changingContactId, setChangingContactId] = useState<number | null>(null);

  const load = async () => {
    const data = await getAdminChurchGroupContacts();
    setHeader(data.header ?? emptyHeader());
    setContacts(data.contacts);
    setContactForm((current) => (current.id ? current : emptyContact((data.contacts.length || 0) + 1)));
  };

  useEffect(() => {
    load()
      .catch((error) => Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar los contactos."))
      .finally(() => setLoading(false));
  }, []);

  const saveHeader = async () => {
    if (!profile?.id || !header.menu_title?.trim() || !header.screen_title?.trim()) {
      Alert.alert("Campos requeridos", "Ingresa el nombre del menú y el título de la pantalla.");
      return;
    }

    try {
      setSavingHeader(true);
      await saveAdminChurchGroupContactsHeader(profile.id, header);
      await load();
      Alert.alert("Encabezado guardado", "La información del apartado quedó actualizada.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar el encabezado.");
    } finally {
      setSavingHeader(false);
    }
  };

  const editContact = (contact: AdminChurchGroupContact) => {
    setContactForm(contact);
    scrollRef.current?.scrollTo({ y: 500, animated: true });
  };

  const resetContactForm = () => setContactForm(emptyContact((contacts.length || 0) + 1));

  const saveContact = async () => {
    if (!profile?.id || !contactForm.group_name.trim() || !contactForm.contact_name.trim()) {
      Alert.alert("Campos requeridos", "Ingresa el grupo y el nombre del contacto.");
      return;
    }

    try {
      setSavingContact(true);
      await saveAdminChurchGroupContact(profile.id, contactForm);
      await load();
      resetContactForm();
      Alert.alert("Contacto guardado", "El contacto quedó actualizado.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar el contacto.");
    } finally {
      setSavingContact(false);
    }
  };

  const changeContactState = (contact: AdminChurchGroupContact) => {
    const nextActive = !contact.is_active;
    Alert.alert(
      nextActive ? "Restaurar contacto" : "Ocultar contacto",
      nextActive
        ? `¿Deseas volver a mostrar el contacto de ${contact.group_name}?`
        : `Se ocultará el contacto de ${contact.group_name}, pero seguirá guardado en la base de datos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: nextActive ? "Restaurar" : "Ocultar",
          style: nextActive ? "default" : "destructive",
          onPress: async () => {
            if (!profile?.id) return;
            try {
              setChangingContactId(contact.id);
              await setAdminChurchGroupContactActive(profile.id, contact, nextActive);
              await load();
              if (contactForm.id === contact.id) resetContactForm();
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar el contacto.");
            } finally {
              setChangingContactId(null);
            }
          }
        }
      ]
    );
  };

  if (profile?.role !== "super_admin") {
    return <View style={styles.center}><Text style={styles.title}>Acceso restringido</Text></View>;
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;
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
          <Text style={styles.title}>Contactos de grupos</Text>
          <Text style={styles.subtitle}>Administra los contactos visibles para cada grupo o ministerio.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del apartado</Text>
          <TextInput
            onChangeText={(value) => setHeader({ ...header, menu_title: value })}
            placeholder="Nombre en el menú"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.menu_title ?? ""}
          />
          <TextInput
            onChangeText={(value) => setHeader({ ...header, screen_title: value })}
            placeholder="Título de la pantalla"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={header.screen_title ?? ""}
          />
          <TextInput
            multiline
            onChangeText={(value) => setHeader({ ...header, subtitle: value })}
            placeholder="Descripción"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.smallArea]}
            textAlignVertical="top"
            value={header.subtitle ?? ""}
          />
          <View style={styles.setting}>
            <Text style={styles.settingText}>Mostrar apartado en Más</Text>
            <Switch
              onValueChange={(value) => setHeader({ ...header, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={header.is_active}
            />
          </View>
          <Pressable disabled={savingHeader} onPress={saveHeader} style={[styles.button, savingHeader && styles.disabled]}>
            {savingHeader ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar información</Text>}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{contactForm.id ? "Editar contacto" : "Añadir contacto"}</Text>
          <TextInput
            onChangeText={(value) => setContactForm({ ...contactForm, group_name: value })}
            placeholder="Grupo o ministerio"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={contactForm.group_name}
          />
          <TextInput
            onChangeText={(value) => setContactForm({ ...contactForm, contact_name: value })}
            placeholder="Nombre del contacto"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={contactForm.contact_name}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(value) => setContactForm({ ...contactForm, email: value })}
            placeholder="Correo"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={contactForm.email ?? ""}
          />
          <View style={styles.row}>
            <TextInput
              keyboardType="phone-pad"
              onChangeText={(value) => setContactForm({ ...contactForm, phone: value })}
              placeholder="Teléfono opcional"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.flex]}
              value={contactForm.phone ?? ""}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => setContactForm({ ...contactForm, sort_order: Number.parseInt(value, 10) || 0 })}
              placeholder="Orden"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.orderInput]}
              value={String(contactForm.sort_order)}
            />
          </View>
          <TextInput
            multiline
            onChangeText={(value) => setContactForm({ ...contactForm, notes: value })}
            placeholder="Notas opcionales"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.smallArea]}
            textAlignVertical="top"
            value={contactForm.notes ?? ""}
          />
          <View style={styles.setting}>
            <Text style={styles.settingText}>Contacto visible</Text>
            <Switch
              onValueChange={(value) => setContactForm({ ...contactForm, is_active: value })}
              thumbColor={colors.text}
              trackColor={{ false: colors.cardGray, true: colors.gold }}
              value={contactForm.is_active}
            />
          </View>
          <Pressable disabled={savingContact} onPress={saveContact} style={[styles.button, savingContact && styles.disabled]}>
            {savingContact ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar contacto</Text>}
          </Pressable>
          {contactForm.id ? (
            <Pressable onPress={resetContactForm} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Cancelar edición</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactos registrados</Text>
          <Text style={styles.helperText}>Los contactos ocultos no aparecen en la app, pero permanecen guardados.</Text>
          {contacts.map((contact) => (
            <View key={contact.id} style={[styles.contactItem, !contact.is_active && styles.inactive]}>
              <Pressable onPress={() => editContact(contact)} style={styles.contactMain}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{contact.sort_order}</Text>
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactGroup}>{contact.group_name}</Text>
                  <Text style={styles.contactMeta}>
                    {[contact.contact_name, contact.email, contact.is_active ? "Visible" : "Oculto"].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Ionicons name="pencil" color={colors.gold} size={19} />
              </Pressable>
              <Pressable
                disabled={changingContactId === contact.id}
                onPress={() => changeContactState(contact)}
                style={[styles.stateButton, contact.is_active ? styles.removeButton : styles.restoreButton]}
              >
                {changingContactId === contact.id ? (
                  <ActivityIndicator color={contact.is_active ? colors.danger : colors.gold} size="small" />
                ) : (
                  <>
                    <Ionicons name={contact.is_active ? "trash-outline" : "refresh"} color={contact.is_active ? colors.danger : colors.gold} size={17} />
                    <Text style={[styles.stateButtonText, { color: contact.is_active ? colors.danger : colors.gold }]}>
                      {contact.is_active ? "Ocultar" : "Restaurar"}
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
  smallArea: { minHeight: 78, paddingTop: 13 },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  orderInput: { width: 92 },
  setting: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingText: { color: colors.text, fontFamily: fonts.semiBold },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontFamily: fonts.extraBold },
  secondaryButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.textSecondary, fontFamily: fonts.bold },
  contactItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 10 },
  inactive: { opacity: 0.68 },
  contactMain: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10 },
  orderBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  orderText: { color: colors.gold, fontSize: 13, fontFamily: fonts.black },
  contactText: { flex: 1, gap: 3 },
  contactGroup: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  contactMeta: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontFamily: fonts.regular },
  stateButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  removeButton: { borderColor: "rgba(255,90,90,0.35)" },
  restoreButton: { borderColor: colors.gold },
  stateButtonText: { fontSize: 12, fontFamily: fonts.bold }
});
