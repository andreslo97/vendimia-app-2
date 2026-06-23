import { supabase } from "./supabase";
import { getColombiaDate } from "@/utils/colombiaDateTime";

export type HomeHeader = {
  app_label: string | null;
  title: string | null;
  subtitle: string | null;
  avatar_text: string | null;
};

export type HomeBanner = {
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_route: string | null;
  background_color: string | null;
  accent_color: string | null;
  badge_text: string | null;
  image_url: string | null;
};

export type DailyWord = {
  verse: string | null;
  reference: string | null;
  reflection: string | null;
  accent_color: string | null;
};

export type HomeStat = {
  label: string | null;
  value: string | null;
};

export type HomeSection = {
  section_key: string | null;
  title: string | null;
  action_text: string | null;
};

export type EventItem = {
  id?: number;
  title: string | null;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  maps_url?: string | null;
  background_color?: string | null;
  accent_color?: string | null;
  image_url?: string | null;
};

export type HomeQuickLink = {
  title: string | null;
  route: string | null;
  icon_name: string | null;
  background_color: string | null;
  accent_color: string | null;
};

export type Devotional = {
  title: string | null;
  description: string | null;
  icon: string | null;
};

export type DailyDevotional = {
  title: string;
  verse: string;
  body: string;
  devotional_date: string;
};

export type PrayerHighlight = {
  title: string | null;
  description: string | null;
  button_text: string | null;
};

export type HomeSongPreview = {
  id: number;
  title: string;
  artist: string | null;
  audio_preview_url: string;
  cover_url: string | null;
  preview_duration_seconds: number | null;
};

export type HomeData = {
  header: HomeHeader | null;
  banners: HomeBanner[];
  dailyWord: DailyWord | null;
  stats: HomeStat[];
  sections: HomeSection[];
  quickLinks: HomeQuickLink[];
  upcomingEvents: EventItem[];
  nextEvent: EventItem | null;
  devotional: Devotional | null;
  dailyDevotional: DailyDevotional | null;
  prayerHighlight: PrayerHighlight | null;
  songPreview: HomeSongPreview | null;
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getHomeData(): Promise<HomeData> {
  const [
    header,
    banners,
    dailyWord,
    stats,
    sections,
    quickLinks,
    upcomingEvents,
    nextEvent,
    devotional,
    dailyDevotional,
    prayerHighlight,
    songPreview
  ] = await Promise.all([
    supabase.from("home_header").select("app_label,title,subtitle,avatar_text").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("home_banners").select("title,subtitle,button_text,button_route,background_color,accent_color,badge_text,image_url").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("daily_words").select("verse,reference,reflection,accent_color").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("home_stats").select("label,value").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("home_sections").select("section_key,title,action_text").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("home_quick_links").select("title,route,icon_name,background_color,accent_color").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("events")
      .select("id,title,description,event_date,event_time,location,maps_url,background_color,accent_color,image_url")
      .eq("is_active", true)
      .eq("show_on_home", true)
      .gte("event_date", getColombiaDate())
      .order("home_sort_order", { ascending: true })
      .order("event_date", { ascending: true })
      .limit(2),
    supabase.from("events").select("id,title,description,event_date,event_time,location,maps_url").eq("is_active", true).gte("event_date", getColombiaDate()).order("event_date", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("devotionals").select("title,description,icon").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("daily_devotionals").select("title,verse,body,devotional_date").eq("devotional_date", getColombiaDate()).eq("is_active", true).maybeSingle(),
    supabase.from("prayer_highlights").select("title,description,button_text").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from("home_featured_song")
      .select("id,title,artist,audio_preview_url,cover_url,preview_duration_seconds")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    header: unwrap(header),
    banners: unwrap(banners) ?? [],
    dailyWord: unwrap(dailyWord),
    stats: unwrap(stats) ?? [],
    sections: unwrap(sections) ?? [],
    quickLinks: unwrap(quickLinks) ?? [],
    upcomingEvents: unwrap(upcomingEvents) ?? [],
    nextEvent: unwrap(nextEvent),
    devotional: unwrap(devotional),
    dailyDevotional: unwrap(dailyDevotional),
    prayerHighlight: unwrap(prayerHighlight),
    songPreview: unwrap(songPreview)
  };
}
