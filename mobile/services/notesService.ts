import { supabase } from "./supabase";
import { getColombiaDate } from "@/utils/colombiaDateTime";

export type DiscipleshipNote = {
  id: number;
  title: string | null;
  body: string;
  note_date: string;
  created_at: string;
};

export type NotesScreenContent = {
  title: string | null;
  subtitle: string | null;
  title_placeholder: string | null;
  body_placeholder: string | null;
  button_text: string | null;
  empty_text: string | null;
};

export type NotesData = {
  content: NotesScreenContent | null;
  notes: DiscipleshipNote[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getNotesData(userId: string): Promise<NotesData> {
  const [contentResult, notesResult] = await Promise.all([
    supabase
      .from("discipleship_notes_content")
      .select("title,subtitle,title_placeholder,body_placeholder,button_text,empty_text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("discipleship_notes")
      .select("id,title,body,note_date,created_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false })
  ]);

  return {
    content: unwrap(contentResult),
    notes: unwrap(notesResult) ?? []
  };
}

export async function createDiscipleshipNote(userId: string, title: string, body: string) {
  const today = getColombiaDate();
  const { error } = await supabase.from("discipleship_notes").insert({
    user_id: userId,
    title: title.trim() || null,
    body: body.trim(),
    note_date: today
  });

  if (error) throw error;
}

export async function updateDiscipleshipNote(userId: string, noteId: number, title: string, body: string) {
  const { error } = await supabase
    .from("discipleship_notes")
    .update({
      title: title.trim() || null,
      body: body.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", noteId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
}

export async function deactivateDiscipleshipNote(userId: string, noteId: number) {
  const { error } = await supabase
    .from("discipleship_notes")
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) throw error;
}
