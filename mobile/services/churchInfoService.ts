import { supabase } from "./supabase";

export type ChurchInfo = {
  title: string | null;
  subtitle: string | null;
  who_title: string | null;
  who_body: string | null;
  vision_title: string | null;
  vision_body: string | null;
  mission_title: string | null;
  mission_body: string | null;
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getChurchInfo(): Promise<ChurchInfo | null> {
  const result = await supabase
    .from("church_info")
    .select("title,subtitle,who_title,who_body,vision_title,vision_body,mission_title,mission_body")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrap(result);
}
