import { supabase } from "./supabase";

export type GivingAccount = {
  menu_title: string | null;
  screen_title: string | null;
  subtitle: string | null;
  qr_image_url: string | null;
  account_type: string | null;
  bank_name: string | null;
  account_number: string | null;
  tax_id_label: string | null;
  tax_id_value: string | null;
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getGivingAccount() {
  const result = await supabase
    .from("giving_accounts")
    .select("menu_title,screen_title,subtitle,qr_image_url,account_type,bank_name,account_number,tax_id_label,tax_id_value")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrap(result);
}
