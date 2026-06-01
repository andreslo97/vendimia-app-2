import { supabase } from "./supabase";

export type LeadershipScheduleHeader = {
  menu_title: string | null;
  screen_title: string | null;
  side_label: string | null;
  subtitle: string | null;
};

export type LeadershipScheduleItem = {
  title: string | null;
  description: string | null;
};

export type LeadershipScheduleData = {
  header: LeadershipScheduleHeader | null;
  items: LeadershipScheduleItem[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getLeadershipScheduleHeader() {
  const result = await supabase
    .from("leadership_schedule_header")
    .select("menu_title,screen_title,side_label,subtitle")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrap(result);
}

export async function getLeadershipScheduleData(): Promise<LeadershipScheduleData> {
  const [header, items] = await Promise.all([
    getLeadershipScheduleHeader(),
    supabase
      .from("leadership_schedule_items")
      .select("title,description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
  ]);

  return {
    header,
    items: unwrap(items) ?? []
  };
}
