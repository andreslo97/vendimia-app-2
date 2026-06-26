import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { createPrayerRequest, getPrayerData, markPrayerRequestAnswered, PrayerData, PrayerRequestItem, togglePrayerLike } from "@/services/prayerService";
import { colors } from "@/theme/colors";
import { formatColombiaDate } from "@/utils/colombiaDateTime";
import { runRefresh } from "@/utils/refresh";

export default function PrayerScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<PrayerData | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeLikeId, setActiveLikeId] = useState<number | null>(null);
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setData(await getPrayerData(user.id));
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [user?.id]);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(load).finally(() => setRefreshing(false));
  };

  const submit = async () => {
    const cleanBody = body.trim();
    if (!user?.id || !cleanBody) return;

    try {
      setSubmitting(true);
      await createPrayerRequest(user.id, cleanBody);
      setBody("");
      await load();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar el motivo.");
    } finally {
      setSubmitting(false);
    }
  };

  const pressLike = async (request: PrayerRequestItem) => {
    if (!user?.id) return;

    try {
      setActiveLikeId(request.id);
      await togglePrayerLike(request.id, user.id, request.likedByMe);
      await load();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar la reaccion.");
    } finally {
      setActiveLikeId(null);
    }
  };

  const confirmAnswered = (request: PrayerRequestItem) => {
    if (!user?.id || request.userId !== user.id) return;

    Alert.alert(
      "Oración respondida",
      "Este motivo de oración dejará de visualizarse",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setAnsweringId(request.id);
              await markPrayerRequestAnswered(request.id, user.id);
              await load();
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "No fue posible actualizar el motivo.");
            } finally {
              setAnsweringId(null);
            }
          }
        }
      ]
    );
  };

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
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl colors={[colors.gold]} progressBackgroundColor={colors.cardDark} refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
        style={styles.screen}
      >
      {data?.content ? (
        <View style={styles.header}>
          {data.content.title ? <Text style={styles.title}>{data.content.title}</Text> : null}
          {data.content.subtitle ? <Text style={styles.subtitle}>{data.content.subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={styles.formCard}>
        <TextInput
          multiline
          onChangeText={setBody}
          placeholder={data?.content?.input_placeholder ?? undefined}
          placeholderTextColor={colors.textSecondary}
          style={styles.textArea}
          textAlignVertical="top"
          value={body}
        />
        {data?.content?.button_text ? (
          <Pressable disabled={submitting || !body.trim()} onPress={submit} style={[styles.submitButton, (!body.trim() || submitting) && styles.disabledButton]}>
            {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.submitText}>{data.content.button_text}</Text>}
          </Pressable>
        ) : null}
      </View>

      {data?.requests.length ? (
        data.requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <Text style={styles.body}>{request.body}</Text>
            <View style={styles.footer}>
              <Text style={styles.date}>{formatColombiaDate(request.created_at)}</Text>
              <Pressable disabled={activeLikeId === request.id} onPress={() => pressLike(request)} style={styles.likeButton}>
                <Ionicons name={request.likedByMe ? "heart" : "heart-outline"} color={request.likedByMe ? colors.gold : colors.textSecondary} size={20} />
                <Text style={[styles.likeText, request.likedByMe && styles.likeTextActive]}>
                  {request.likeCount} {request.likedByMe ? data.content?.unlike_text : data.content?.like_text}
                </Text>
              </Pressable>
            </View>
            {request.userId === user?.id ? (
              <Pressable disabled={answeringId === request.id} onPress={() => confirmAnswered(request)} style={styles.answeredButton}>
                {answeringId === request.id ? (
                  <ActivityIndicator color={colors.gold} size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" color={colors.gold} size={18} />
                )}
                <Text style={styles.answeredText}>Recibí respuesta de mi oración</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      ) : data?.content?.empty_text ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{data.content.empty_text}</Text>
        </View>
      ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 31, fontWeight: "900" },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  formCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 12 },
  textArea: { minHeight: 112, color: colors.text, fontSize: 15, lineHeight: 22 },
  submitButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabledButton: { opacity: 0.55 },
  submitText: { color: colors.background, fontSize: 15, fontWeight: "800" },
  requestCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 14 },
  body: { color: colors.text, fontSize: 16, lineHeight: 23 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  date: { color: colors.textSecondary, fontSize: 12 },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
  likeText: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
  likeTextActive: { color: colors.gold },
  answeredButton: { minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12 },
  answeredText: { color: colors.gold, fontSize: 13, fontWeight: "800", textAlign: "center" },
  emptyCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.line, padding: 18, backgroundColor: colors.cardDark },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }
});
