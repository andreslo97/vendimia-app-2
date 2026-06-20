import { supabase } from "./supabase";

export type WeeklySongsHeader = {
  menu_title: string | null;
  screen_title: string | null;
  week_label: string | null;
  subtitle: string | null;
};

export type WeeklySong = {
  id: number;
  title: string;
  artist: string | null;
  musical_key: string | null;
  notes: string | null;
  reference_url: string | null;
};

export type WeeklySongsData = {
  header: WeeklySongsHeader | null;
  songs: WeeklySong[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getWeeklySongsHeader() {
  const result = await supabase
    .from("weekly_songs_header")
    .select("menu_title,screen_title,week_label,subtitle")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrap(result);
}

export async function getWeeklySongsData(): Promise<WeeklySongsData> {
  const [header, songs] = await Promise.all([
    getWeeklySongsHeader(),
    supabase
      .from("weekly_songs")
      .select("id,title,artist,musical_key,notes,reference_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
  ]);

  return {
    header,
    songs: unwrap(songs) ?? []
  };
}
