import { supabase } from "./supabase";

export type BibleScreenContent = {
  title: string | null;
  subtitle: string | null;
  empty_text: string | null;
};

export type BibleVersion = {
  id: number;
  title: string | null;
  description: string | null;
  abbreviation: string | null;
  viewer_url: string;
  external_url: string | null;
};

export type BibleData = {
  content: BibleScreenContent | null;
  versions: BibleVersion[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getBibleData(): Promise<BibleData> {
  const [contentResult, versionsResult] = await Promise.all([
    supabase
      .from("bible_screen_content")
      .select("title,subtitle,empty_text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bible_versions")
      .select("id,title,description,abbreviation,viewer_url,external_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
  ]);

  return {
    content: unwrap(contentResult),
    versions: unwrap(versionsResult) ?? []
  };
}

export async function getBibleVersionById(id: number): Promise<BibleVersion | null> {
  const result = await supabase
    .from("bible_versions")
    .select("id,title,description,abbreviation,viewer_url,external_url")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  return unwrap(result);
}
