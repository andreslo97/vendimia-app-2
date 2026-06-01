import { supabase } from "./supabase";

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

export type DevotionalData = {
  content: DevotionalScreenContent | null;
  notes: DevotionalNote[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getDevotionalData(userId: string): Promise<DevotionalData> {
  const [contentResult, notesResult] = await Promise.all([
    supabase
      .from("devotional_screen_content")
      .select("title,subtitle,reference_placeholder,title_placeholder,note_placeholder,save_button_text,empty_text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("devotional_notes")
      .select("id,passage_reference,title,body,note_date,created_at")
      .eq("user_id", userId)
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false })
  ]);

  return {
    content: unwrap(contentResult),
    notes: unwrap(notesResult) ?? []
  };
}

export async function createDevotionalNote(userId: string, passageReference: string, title: string, body: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("devotional_notes").insert({
    user_id: userId,
    passage_reference: passageReference.trim(),
    title: title.trim() || null,
    body: body.trim(),
    note_date: today
  });

  if (error) throw error;
}
