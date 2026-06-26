import { supabase } from "./supabase";

export type ChurchGroupContactsHeader = {
  menu_title: string | null;
  screen_title: string | null;
  subtitle: string | null;
};

export type ChurchGroupContact = {
  id: number;
  group_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type ChurchGroupContactsData = {
  header: ChurchGroupContactsHeader | null;
  contacts: ChurchGroupContact[];
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getChurchGroupContactsHeader() {
  const result = await supabase
    .from("church_group_contacts_header")
    .select("menu_title,screen_title,subtitle")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrap(result);
}

export async function getChurchGroupContactsData(): Promise<ChurchGroupContactsData> {
  const [header, contacts] = await Promise.all([
    getChurchGroupContactsHeader(),
    supabase
      .from("church_group_contacts")
      .select("id,group_name,contact_name,email,phone,notes")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
  ]);

  return {
    header,
    contacts: unwrap(contacts) ?? []
  };
}
