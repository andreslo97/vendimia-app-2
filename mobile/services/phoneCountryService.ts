import { supabase } from "@/services/supabase";

export type PhoneCountryCode = {
  id: number;
  country_name: string;
  country_code: string;
};

export const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "");

export const getPhoneCountryCodes = async () => {
  const { data, error } = await supabase
    .from("phone_country_codes")
    .select("id,country_name,country_code")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PhoneCountryCode[];
};

export const resolveEmailByPhone = async (countryCode: string, phoneNumber: string) => {
  const { data, error } = await supabase.rpc("find_email_by_phone", {
    input_country_code: countryCode,
    input_phone_number: normalizePhoneNumber(phoneNumber)
  });

  if (error) throw error;
  return typeof data === "string" && data ? data : null;
};
