import { supabase } from "@/services/supabase";

export type AdminEvent = {
  id: number;
  title: string | null;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  maps_url: string | null;
  image_url: string | null;
  show_on_home: boolean;
  home_sort_order: number;
  is_active: boolean;
};

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  can_manage_appointments: boolean;
  phone_country_code: string | null;
  phone_number: string | null;
  created_at: string;
};

export type AdminHomeContent = {
  header: {
    id: number;
    app_label: string | null;
    title: string | null;
    subtitle: string | null;
  } | null;
  banner: {
    id: number;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_route: string | null;
    badge_text: string | null;
    image_url: string | null;
  } | null;
  dailyWord: {
    id: number;
    verse: string | null;
    reference: string | null;
    reflection: string | null;
  } | null;
};

export type AdminLeadershipHeader = {
  id: number;
  menu_title: string | null;
  screen_title: string | null;
  side_label: string | null;
  subtitle: string | null;
  is_active: boolean;
};

export type AdminLeadershipItem = {
  id: number;
  title: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type AdminWeeklySongsHeader = {
  id: number;
  menu_title: string | null;
  screen_title: string | null;
  week_label: string | null;
  subtitle: string | null;
  is_active: boolean;
};

export type AdminWeeklySong = {
  id: number;
  title: string;
  artist: string | null;
  musical_key: string | null;
  notes: string | null;
  reference_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type AdminHomeFeaturedSong = {
  id: number;
  title: string;
  artist: string | null;
  audio_preview_url: string;
  cover_url: string | null;
  reference_url: string | null;
  preview_duration_seconds: number | null;
  is_active: boolean;
};

export type AdminChurchGroupContactsHeader = {
  id: number;
  menu_title: string | null;
  screen_title: string | null;
  subtitle: string | null;
  is_active: boolean;
};

export type AdminChurchGroupContact = {
  id: number;
  group_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
};

export const logAdminAction = async (
  adminUserId: string,
  module: string,
  action: string,
  entityTable?: string,
  entityId?: string | number,
  newData?: Record<string, unknown>
) => {
  await supabase.from("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    module,
    action,
    entity_table: entityTable ?? null,
    entity_id: entityId === undefined ? null : String(entityId),
    new_data: newData ?? null
  });
};

export const getAdminEvents = async () => {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,description,event_date,event_time,location,maps_url,image_url,show_on_home,home_sort_order,is_active")
    .order("event_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminEvent[];
};

export const saveAdminEvent = async (
  adminUserId: string,
  event: Omit<AdminEvent, "id"> & { id?: number }
) => {
  const payload = {
    title: event.title?.trim() || null,
    description: event.description?.trim() || null,
    event_date: event.event_date || null,
    event_time: event.event_time?.trim() || null,
    location: event.location?.trim() || null,
    maps_url: event.maps_url?.trim() || null,
    image_url: event.image_url?.trim() || null,
    show_on_home: event.show_on_home,
    home_sort_order: event.home_sort_order,
    is_active: event.is_active
  };

  if (event.id) {
    const { error } = await supabase.from("events").update(payload).eq("id", event.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "events", "update", "events", event.id, payload);
    return;
  }

  const { data, error } = await supabase.from("events").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "events", "create", "events", data.id, payload);
};

export const getAdminUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,can_manage_appointments,phone_country_code,phone_number,created_at")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AdminUser[];
};

export const updateAdminUserPermissions = async (
  userId: string,
  role: string,
  canManageAppointments: boolean
) => {
  const { error } = await supabase.rpc("admin_update_user_permissions", {
    target_user_id: userId,
    next_role: role,
    next_can_manage_appointments: canManageAppointments
  });

  if (error) throw error;
};

export const getAdminHomeContent = async (): Promise<AdminHomeContent> => {
  const [header, banner, dailyWord] = await Promise.all([
    supabase.from("home_header").select("id,app_label,title,subtitle").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("home_banners").select("id,title,subtitle,button_text,button_route,badge_text,image_url").order("sort_order", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("daily_words").select("id,verse,reference,reflection").order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);

  if (header.error) throw header.error;
  if (banner.error) throw banner.error;
  if (dailyWord.error) throw dailyWord.error;

  return {
    header: header.data,
    banner: banner.data,
    dailyWord: dailyWord.data
  };
};

export const updateAdminHomeRow = async (
  adminUserId: string,
  table: "home_header" | "home_banners" | "daily_words",
  id: number,
  payload: Record<string, unknown>
) => {
  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) throw error;
  await logAdminAction(adminUserId, "home", "update", table, id, payload);
};

export const getAdminSystemStats = async () => {
  const [users, tokens, pendingJobs, failedJobs, pendingAppointments, events] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_push_tokens").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("notification_jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notification_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("pastor_appointments").select("id", { count: "exact", head: true }).in("status", ["enviado", "pendiente"]),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("is_active", true)
  ]);

  return {
    users: users.count ?? 0,
    activeTokens: tokens.count ?? 0,
    pendingJobs: pendingJobs.count ?? 0,
    failedJobs: failedJobs.count ?? 0,
    pendingAppointments: pendingAppointments.count ?? 0,
    activeEvents: events.count ?? 0
  };
};

export const getAdminLeadershipSchedule = async () => {
  const [headerResult, itemsResult] = await Promise.all([
    supabase
      .from("leadership_schedule_header")
      .select("id,menu_title,screen_title,side_label,subtitle,is_active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("leadership_schedule_items")
      .select("id,title,description,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
  ]);

  if (headerResult.error) throw headerResult.error;
  if (itemsResult.error) throw itemsResult.error;

  return {
    header: headerResult.data as AdminLeadershipHeader | null,
    items: (itemsResult.data ?? []) as AdminLeadershipItem[]
  };
};

export const saveAdminLeadershipHeader = async (
  adminUserId: string,
  header: Omit<AdminLeadershipHeader, "id"> & { id?: number }
) => {
  const payload = {
    menu_title: header.menu_title?.trim() || null,
    screen_title: header.screen_title?.trim() || null,
    side_label: header.side_label?.trim() || null,
    subtitle: header.subtitle?.trim() || null,
    is_active: header.is_active
  };

  if (header.id) {
    const { error } = await supabase.from("leadership_schedule_header").update(payload).eq("id", header.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "leadership_schedule", "update_header", "leadership_schedule_header", header.id, payload);
    return;
  }

  const { data, error } = await supabase.from("leadership_schedule_header").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "leadership_schedule", "create_header", "leadership_schedule_header", data.id, payload);
};

export const saveAdminLeadershipItem = async (
  adminUserId: string,
  item: Omit<AdminLeadershipItem, "id"> & { id?: number }
) => {
  const payload = {
    title: item.title?.trim() || null,
    description: item.description?.trim() || null,
    sort_order: item.sort_order,
    is_active: item.is_active
  };

  if (item.id) {
    const { error } = await supabase.from("leadership_schedule_items").update(payload).eq("id", item.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "leadership_schedule", "update_item", "leadership_schedule_items", item.id, payload);
    return;
  }

  const { data, error } = await supabase.from("leadership_schedule_items").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "leadership_schedule", "create_item", "leadership_schedule_items", data.id, payload);
};

export const setAdminLeadershipItemActive = async (
  adminUserId: string,
  item: AdminLeadershipItem,
  isActive: boolean
) => {
  const { error } = await supabase
    .from("leadership_schedule_items")
    .update({ is_active: isActive })
    .eq("id", item.id);

  if (error) throw error;
  await logAdminAction(
    adminUserId,
    "leadership_schedule",
    isActive ? "restore_item" : "deactivate_item",
    "leadership_schedule_items",
    item.id,
    { is_active: isActive }
  );
};

export const getAdminWeeklySongs = async () => {
  const [headerResult, songsResult] = await Promise.all([
    supabase
      .from("weekly_songs_header")
      .select("id,menu_title,screen_title,week_label,subtitle,is_active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("weekly_songs")
      .select("id,title,artist,musical_key,notes,reference_url,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
  ]);

  if (headerResult.error) throw headerResult.error;
  if (songsResult.error) throw songsResult.error;

  return {
    header: headerResult.data as AdminWeeklySongsHeader | null,
    songs: (songsResult.data ?? []) as AdminWeeklySong[]
  };
};

export const saveAdminWeeklySongsHeader = async (
  adminUserId: string,
  header: Omit<AdminWeeklySongsHeader, "id"> & { id?: number }
) => {
  const payload = {
    menu_title: header.menu_title?.trim() || null,
    screen_title: header.screen_title?.trim() || null,
    week_label: header.week_label?.trim() || null,
    subtitle: header.subtitle?.trim() || null,
    is_active: header.is_active
  };

  if (header.id) {
    const { error } = await supabase.from("weekly_songs_header").update(payload).eq("id", header.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "weekly_songs", "update_header", "weekly_songs_header", header.id, payload);
    return;
  }

  const { data, error } = await supabase.from("weekly_songs_header").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "weekly_songs", "create_header", "weekly_songs_header", data.id, payload);
};

export const saveAdminWeeklySong = async (
  adminUserId: string,
  song: Omit<AdminWeeklySong, "id"> & { id?: number }
) => {
  const payload = {
    title: song.title.trim(),
    artist: song.artist?.trim() || null,
    musical_key: song.musical_key?.trim() || null,
    notes: song.notes?.trim() || null,
    reference_url: song.reference_url?.trim() || null,
    sort_order: song.sort_order,
    is_active: song.is_active
  };

  if (song.id) {
    const { error } = await supabase.from("weekly_songs").update(payload).eq("id", song.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "weekly_songs", "update_song", "weekly_songs", song.id, payload);
    return;
  }

  const { data, error } = await supabase.from("weekly_songs").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "weekly_songs", "create_song", "weekly_songs", data.id, payload);
};

export const setAdminWeeklySongActive = async (
  adminUserId: string,
  song: AdminWeeklySong,
  isActive: boolean
) => {
  const { error } = await supabase.from("weekly_songs").update({ is_active: isActive }).eq("id", song.id);
  if (error) throw error;

  await logAdminAction(
    adminUserId,
    "weekly_songs",
    isActive ? "restore_song" : "deactivate_song",
    "weekly_songs",
    song.id,
    { is_active: isActive }
  );
};

export const getAdminHomeFeaturedSong = async () => {
  const { data, error } = await supabase
    .from("home_featured_song")
    .select("id,title,artist,audio_preview_url,cover_url,reference_url,preview_duration_seconds,is_active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as AdminHomeFeaturedSong | null;
};

export const saveAdminHomeFeaturedSong = async (
  adminUserId: string,
  song: Omit<AdminHomeFeaturedSong, "id"> & { id?: number }
) => {
  const payload = {
    title: song.title.trim(),
    artist: song.artist?.trim() || null,
    audio_preview_url: song.audio_preview_url.trim(),
    cover_url: song.cover_url?.trim() || null,
    reference_url: song.reference_url?.trim() || null,
    preview_duration_seconds:
      song.preview_duration_seconds && song.preview_duration_seconds > 0
        ? Math.floor(song.preview_duration_seconds)
        : null,
    is_active: song.is_active,
    updated_at: new Date().toISOString()
  };

  if (song.id) {
    const { error } = await supabase.from("home_featured_song").update(payload).eq("id", song.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "home_featured_song", "update", "home_featured_song", song.id, payload);
    return;
  }

  const { error: deactivateError } = await supabase.from("home_featured_song").update({ is_active: false }).eq("is_active", true);
  if (deactivateError) throw deactivateError;

  const { data, error } = await supabase.from("home_featured_song").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "home_featured_song", "create", "home_featured_song", data.id, payload);
};

export const getAdminChurchGroupContacts = async () => {
  const [headerResult, contactsResult] = await Promise.all([
    supabase
      .from("church_group_contacts_header")
      .select("id,menu_title,screen_title,subtitle,is_active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("church_group_contacts")
      .select("id,group_name,contact_name,email,phone,notes,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
  ]);

  if (headerResult.error) throw headerResult.error;
  if (contactsResult.error) throw contactsResult.error;

  return {
    header: headerResult.data as AdminChurchGroupContactsHeader | null,
    contacts: (contactsResult.data ?? []) as AdminChurchGroupContact[]
  };
};

export const saveAdminChurchGroupContactsHeader = async (
  adminUserId: string,
  header: Omit<AdminChurchGroupContactsHeader, "id"> & { id?: number }
) => {
  const payload = {
    menu_title: header.menu_title?.trim() || null,
    screen_title: header.screen_title?.trim() || null,
    subtitle: header.subtitle?.trim() || null,
    is_active: header.is_active
  };

  if (header.id) {
    const { error } = await supabase.from("church_group_contacts_header").update(payload).eq("id", header.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "church_group_contacts", "update_header", "church_group_contacts_header", header.id, payload);
    return;
  }

  const { data, error } = await supabase.from("church_group_contacts_header").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "church_group_contacts", "create_header", "church_group_contacts_header", data.id, payload);
};

export const saveAdminChurchGroupContact = async (
  adminUserId: string,
  contact: Omit<AdminChurchGroupContact, "id"> & { id?: number }
) => {
  const payload = {
    group_name: contact.group_name.trim(),
    contact_name: contact.contact_name.trim(),
    email: contact.email?.trim() || null,
    phone: contact.phone?.trim() || null,
    notes: contact.notes?.trim() || null,
    sort_order: contact.sort_order,
    is_active: contact.is_active,
    updated_at: new Date().toISOString()
  };

  if (contact.id) {
    const { error } = await supabase.from("church_group_contacts").update(payload).eq("id", contact.id);
    if (error) throw error;
    await logAdminAction(adminUserId, "church_group_contacts", "update_contact", "church_group_contacts", contact.id, payload);
    return;
  }

  const { data, error } = await supabase.from("church_group_contacts").insert(payload).select("id").single();
  if (error) throw error;
  await logAdminAction(adminUserId, "church_group_contacts", "create_contact", "church_group_contacts", data.id, payload);
};

export const setAdminChurchGroupContactActive = async (
  adminUserId: string,
  contact: AdminChurchGroupContact,
  isActive: boolean
) => {
  const payload = { is_active: isActive, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("church_group_contacts").update(payload).eq("id", contact.id);
  if (error) throw error;

  await logAdminAction(
    adminUserId,
    "church_group_contacts",
    isActive ? "restore_contact" : "deactivate_contact",
    "church_group_contacts",
    contact.id,
    payload
  );
};
