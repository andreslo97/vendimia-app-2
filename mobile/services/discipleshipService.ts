import { supabase } from "./supabase";

export type DiscipleshipHeader = {
  app_label: string | null;
  title: string | null;
  subtitle: string | null;
};

export type DiscipleshipModule = {
  title: string | null;
  description: string | null;
  icon_name: string | null;
  route: string | null;
  background_color: string | null;
  accent_color: string | null;
};

export type DiscipleshipData = {
  header: DiscipleshipHeader | null;
  modules: DiscipleshipModule[];
};

export type DiscipleshipMaterial = {
  id: number;
  title: string | null;
  description: string | null;
  bucket_id: string;
  storage_path: string;
  allowed_role: string;
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getDiscipleshipData(): Promise<DiscipleshipData> {
  const [header, modules] = await Promise.all([
    supabase.from("discipleship_header").select("app_label,title,subtitle").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("discipleship_modules").select("title,description,icon_name,route,background_color,accent_color").eq("is_active", true).order("sort_order", { ascending: true })
  ]);

  return {
    header: unwrap(header),
    modules: unwrap(modules) ?? []
  };
}

export async function getDiscipleshipMaterials(): Promise<DiscipleshipMaterial[]> {
  const result = await supabase
    .from("discipleship_materials")
    .select("id,title,description,bucket_id,storage_path,allowed_role")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return unwrap(result) ?? [];
}

export async function getDiscipleshipMaterialById(id: number): Promise<DiscipleshipMaterial | null> {
  const result = await supabase
    .from("discipleship_materials")
    .select("id,title,description,bucket_id,storage_path,allowed_role")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  return unwrap(result);
}

export async function getMaterialSignedUrl(material: DiscipleshipMaterial) {
  const { data, error } = await supabase.storage
    .from(material.bucket_id)
    .createSignedUrl(material.storage_path, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}
