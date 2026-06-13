import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { createDiscipleshipNote, getNotesData, NotesData } from "@/services/notesService";
import { colors } from "@/theme/colors";

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<NotesData | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setData(await getNotesData(user.id));
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [user?.id]);

  const refresh = async () => {
    setRefreshing(true);
    await load().finally(() => setRefreshing(false));
  };

  const submit = async () => {
    if (!user?.id || !body.trim()) return;

    try {
      setSubmitting(true);
      await createDiscipleshipNote(user.id, title, body);
      setTitle("");
      setBody("");
      await load();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible guardar la nota.");
    } finally {
      setSubmitting(false);
    }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
        style={styles.screen}
      >
      <Pressable onPress={() => router.replace("/(tabs)/discipulado")} style={styles.backButton}>
        <Ionicons name="arrow-back" color={colors.text} size={22} />
      </Pressable>

      {data?.content ? (
        <View style={styles.header}>
          {data.content.title ? <Text style={styles.title}>{data.content.title}</Text> : null}
          {data.content.subtitle ? <Text style={styles.subtitle}>{data.content.subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={styles.formCard}>
        <TextInput
          onChangeText={setTitle}
          placeholder={data?.content?.title_placeholder ?? undefined}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={title}
        />
        <TextInput
          multiline
          onChangeText={setBody}
          placeholder={data?.content?.body_placeholder ?? undefined}
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

      {data?.notes.length ? (
        data.notes.map((note) => (
          <View key={note.id} style={styles.noteCard}>
            <Text style={styles.date}>{note.note_date}</Text>
            {note.title ? <Text style={styles.noteTitle}>{note.title}</Text> : null}
            <Text style={styles.noteBody}>{note.body}</Text>
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
  backButton: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 31, fontWeight: "900" },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  formCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 12 },
  input: { minHeight: 48, color: colors.text, fontSize: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  textArea: { minHeight: 120, color: colors.text, fontSize: 15, lineHeight: 22 },
  submitButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  disabledButton: { opacity: 0.55 },
  submitText: { color: colors.background, fontSize: 15, fontWeight: "800" },
  noteCard: { borderRadius: 8, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 8 },
  date: { color: colors.gold, fontSize: 12, fontWeight: "800" },
  noteTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  noteBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  emptyCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.line, padding: 18, backgroundColor: colors.cardDark },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }
});
