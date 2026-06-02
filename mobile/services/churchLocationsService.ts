import { supabase } from "./supabase";

export type ChurchLocationsHeader = {
  menu_title: string | null;
  screen_title: string | null;
  subtitle: string | null;
};

export type ChurchLocation = {
  id: number;
  name: string | null;
  city: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  service_times: string | null;
  maps_url: string | null;
};

export type ChurchLocationsData = {
  header: ChurchLocationsHeader | null;
  locations: ChurchLocation[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getChurchLocationsHeader() {
  const result = await supabase
    .from("church_locations_header")
    .select("menu_title,screen_title,subtitle")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrap(result);
}

export async function getChurchLocationsData(): Promise<ChurchLocationsData> {
  const [header, locations] = await Promise.all([
    getChurchLocationsHeader(),
    supabase
      .from("church_locations")
      .select("id,name,city,address_line_1,address_line_2,service_times,maps_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
  ]);

  return {
    header,
    locations: unwrap(locations) ?? []
  };
}
