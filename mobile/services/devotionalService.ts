import { supabase } from "./supabase";
import { getColombiaDate } from "@/utils/colombiaDateTime";

export type DevotionalScreenContent = {
  title: string | null;
  subtitle: string | null;
  reference_placeholder: string | null;
  title_placeholder: string | null;
  note_placeholder: string | null;
  save_button_text: string | null;
  empty_text: string | null;
};

export type DevotionalNote = {
  id: number;
  passage_reference: string;
  title: string | null;
  body: string;
  note_date: string;
  created_at: string;
};

export type DailyDevotional = {
  id: number;
  devotional_date: string;
  title: string;
  verse: string;
  body: string;
  updated_at: string;
};

export type DevotionalData = {
  content: DevotionalScreenContent | null;
  dailyDevotional: DailyDevotional | null;
  notes: DevotionalNote[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getTodayDailyDevotional(): Promise<DailyDevotional | null> {
  const result = await supabase
    .from("daily_devotionals")
    .select("id,devotional_date,title,verse,body,updated_at")
    .eq("devotional_date", getColombiaDate())
    .eq("is_active", true)
    .maybeSingle();

  return unwrap(result);
}

export async function getDevotionalData(userId: string): Promise<DevotionalData> {
  const [contentResult, dailyDevotionalResult, notesResult] = await Promise.all([
    supabase
      .from("devotional_screen_content")
      .select("title,subtitle,reference_placeholder,title_placeholder,note_placeholder,save_button_text,empty_text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_devotionals")
      .select("id,devotional_date,title,verse,body,updated_at")
      .eq("devotional_date", getColombiaDate())
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("devotional_notes")
      .select("id,passage_reference,title,body,note_date,created_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false })
  ]);

  return {
    content: unwrap(contentResult),
    dailyDevotional: unwrap(dailyDevotionalResult),
    notes: unwrap(notesResult) ?? []
  };
}

export async function saveTodayDailyDevotional(userId: string, title: string, verse: string, body: string) {
  const devotionalDate = getColombiaDate();
  const { error } = await supabase.from("daily_devotionals").upsert(
    {
      devotional_date: devotionalDate,
      title: title.trim(),
      verse: verse.trim(),
      body: body.trim(),
      created_by: userId,
      is_active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: "devotional_date" }
  );

  if (error) throw error;

  await supabase.functions
    .invoke("dispatch-master-notification", {
      body: {
        event: "daily_devotional_published",
        devotionalDate
      }
    })
    .catch(() => undefined);
}

export async function createDevotionalNote(userId: string, passageReference: string, title: string, body: string) {
  const today = getColombiaDate();
  const { error } = await supabase.from("devotional_notes").insert({
    user_id: userId,
    passage_reference: passageReference.trim(),
    title: title.trim() || null,
    body: body.trim(),
    note_date: today
  });

  if (error) throw error;
}

export async function updateDevotionalNote(
  userId: string,
  noteId: number,
  passageReference: string,
  title: string,
  body: string
) {
  const { error } = await supabase
    .from("devotional_notes")
    .update({
      passage_reference: passageReference.trim(),
      title: title.trim() || null,
      body: body.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", noteId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
}

export async function deactivateDevotionalNote(userId: string, noteId: number) {
  const { error } = await supabase
    .from("devotional_notes")
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) throw error;
}
