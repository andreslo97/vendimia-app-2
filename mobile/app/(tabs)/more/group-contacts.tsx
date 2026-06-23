import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChurchGroupContactsData, getChurchGroupContactsData } from "@/services/churchGroupContactsService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { runRefresh } from "@/utils/refresh";

export default function GroupContactsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ChurchGroupContactsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getChurchGroupContactsData());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(load).finally(() => setRefreshing(false));
  };

  const openEmail = async (email?: string | null) => {
    if (!email) return;
    await Linking.openURL(`mailto:${email}`);
  };

  const openPhone = async (phone?: string | null) => {
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
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
      refreshControl={<RefreshControl colors={[colors.gold]} progressBackgroundColor={colors.cardDark} refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      style={styles.screen}
    >
      <Pressable onPress={() => router.replace("/(tabs)/more")} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      {data?.header ? (
        <View style={styles.header}>
          {data.header.menu_title ? <Text style={styles.kicker}>{data.header.menu_title}</Text> : null}
          {data.header.screen_title ? <Text style={styles.title}>{data.header.screen_title}</Text> : null}
          {data.header.subtitle ? <Text style={styles.subtitle}>{data.header.subtitle}</Text> : null}
        </View>
      ) : null}

      {data?.contacts.length ? (
        <View style={styles.list}>
          {data.contacts.map((contact) => (
            <View key={contact.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBubble}>
                  <Ionicons name="people" color={colors.background} size={22} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.groupName}>{contact.group_name}</Text>
                  <Text style={styles.contactName}>{contact.contact_name}</Text>
                </View>
              </View>

              {contact.email ? (
                <Pressable onPress={() => openEmail(contact.email)} style={styles.actionRow}>
                  <Ionicons name="mail" color={colors.gold} size={18} />
                  <Text style={styles.actionText}>{contact.email}</Text>
                  <Ionicons name="open-outline" color={colors.textSecondary} size={17} />
                </Pressable>
              ) : null}

              {contact.phone ? (
                <Pressable onPress={() => openPhone(contact.phone)} style={styles.actionRow}>
                  <Ionicons name="call" color={colors.gold} size={18} />
                  <Text style={styles.actionText}>{contact.phone}</Text>
                  <Ionicons name="open-outline" color={colors.textSecondary} size={17} />
                </Pressable>
              ) : null}

              {contact.notes ? <Text style={styles.notes}>{contact.notes}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" color={colors.gold} size={28} />
          <Text style={styles.emptyText}>No hay contactos disponibles por ahora.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { borderRadius: 18, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 5 },
  kicker: { color: colors.gold, fontSize: 13, fontFamily: fonts.bold },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontFamily: fonts.black },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: fonts.medium },
  list: { gap: 12 },
  card: { borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 13 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBubble: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  cardTitleWrap: { flex: 1, gap: 2 },
  groupName: { color: colors.text, fontSize: 19, lineHeight: 23, fontFamily: fonts.extraBold },
  contactName: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  actionRow: { minHeight: 42, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 },
  actionText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
  notes: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  emptyCard: { borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: "center", gap: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: "center", fontFamily: fonts.medium }
});
