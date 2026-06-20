import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type Body = {
  title?: string;
  body?: string;
  targetRole?: string | null;
};

type PushToken = {
  user_id: string;
  expo_push_token: string;
};

type ExpoPushResponse = {
  status?: string;
  message?: string;
  details?: {
    error?: string;
  };
  id?: string;
};

const installedAppOwnershipValues = ["standalone", "bare"];
const knownPlatforms = ["android", "ios", "web", "unknown"];

const emptyDiagnostics = () => ({
  total: 0,
  active: 0,
  standalone: 0,
  installed: 0,
  by_app_ownership: {} as Record<string, number>,
  by_platform: {} as Record<string, { total: number; active: number; installed: number }>
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const notificationImageUrl = Deno.env.get("NOTIFICATION_IMAGE_URL")?.trim();

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const isSuperAdmin = async (authHeader: string | null) => {
  if (!authHeader) return { ok: false, userId: null };

  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, userId: null };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return { ok: profile?.role === "super_admin", userId: userData.user.id };
};

const getTokens = async (targetRole?: string | null) => {
  let userIds: string[] | null = null;

  if (targetRole) {
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", targetRole);

    if (profilesError) throw profilesError;
    userIds = (profiles ?? []).map((profile) => profile.id);

    if (!userIds.length) return [];
  }

  let query = adminClient
    .from("user_push_tokens")
    .select("user_id,expo_push_token")
    .eq("is_active", true)
    .in("app_ownership", installedAppOwnershipValues);

  if (userIds) {
    query = query.in("user_id", userIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    user_id: row.user_id,
    expo_push_token: row.expo_push_token
  })) as PushToken[];
};

const getTokenDiagnostics = async (targetRole?: string | null) => {
  let userIds: string[] | null = null;

  if (targetRole) {
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", targetRole);

    if (profilesError) throw profilesError;
    userIds = (profiles ?? []).map((profile) => profile.id);
  }

  let query = adminClient
    .from("user_push_tokens")
    .select("app_ownership,is_active,platform");

  if (userIds) {
    if (!userIds.length) return emptyDiagnostics();
    query = query.in("user_id", userIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  return rows.reduce(
    (acc, row) => {
      const ownership = row.app_ownership ?? "null";
      const platform = knownPlatforms.includes(row.platform) ? row.platform : row.platform ?? "unknown";
      const isInstalled = row.is_active && installedAppOwnershipValues.includes(row.app_ownership);

      acc.total += 1;
      if (row.is_active) acc.active += 1;
      if (isInstalled) {
        acc.standalone += 1;
        acc.installed += 1;
      }
      acc.by_app_ownership[ownership] = (acc.by_app_ownership[ownership] ?? 0) + 1;

      acc.by_platform[platform] = acc.by_platform[platform] ?? { total: 0, active: 0, installed: 0 };
      acc.by_platform[platform].total += 1;
      if (row.is_active) acc.by_platform[platform].active += 1;
      if (isInstalled) acc.by_platform[platform].installed += 1;

      return acc;
    },
    emptyDiagnostics()
  );
};

const sendExpoPush = async (tokens: PushToken[], title: string, body: string, route?: string | null) => {
  const messages = tokens.map((token) => ({
    to: token.expo_push_token,
    channelId: "vendimia-general",
    sound: "default",
    title,
    body,
    data: route ? { route } : {},
    ...(notificationImageUrl ? { richContent: { image: notificationImageUrl } } : {})
  }));

  if (!messages.length) return [];

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messages)
  });

  const json = await response.json();
  return (Array.isArray(json.data) ? json.data : [json]) as ExpoPushResponse[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const admin = await isSuperAdmin(req.headers.get("Authorization"));
  if (!admin.ok || !admin.userId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const payload = (await req.json()) as Body;
  const title = payload.title?.trim();
  const body = payload.body?.trim();
  const targetRole = payload.targetRole?.trim() || null;

  if (!title || !body) {
    return new Response(JSON.stringify({ error: "Title and body are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: master, error: masterError } = await adminClient
    .from("notification_master")
    .select("id,is_active,implementation_status,route")
    .eq("notification_key", "general_announcement")
    .maybeSingle();

  if (masterError) throw masterError;
  if (!master) {
    return new Response(JSON.stringify({ error: "Notification MASTER is not configured" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  if (!master.is_active || master.implementation_status !== "ready") {
    return new Response(JSON.stringify({ error: "General announcements are disabled in notification MASTER" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const tokens = await getTokens(targetRole);
  const diagnostics = tokens.length ? null : await getTokenDiagnostics(targetRole);
  const { data: notification, error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      master_id: master.id,
      title,
      body,
      target_role: targetRole,
      notification_type: "manual",
      route: master.route,
      sent_at: new Date().toISOString(),
      created_by: admin.userId
    })
    .select("id")
    .single();

  if (notificationError) throw notificationError;

  const responses = await sendExpoPush(tokens, title, body, master.route);

  if (notification?.id && tokens.length) {
    await adminClient.from("notification_deliveries").insert(
      tokens.map((token, index) => ({
        notification_id: notification.id,
        user_id: token.user_id,
        expo_push_token: token.expo_push_token,
        status: responses[index]?.status ?? "sent",
        response: responses[index] ?? null
      }))
    );
  }

  const accepted = responses.filter((response) => response?.status === "ok").length;
  const failed = responses.filter((response) => response?.status === "error").length;
  const firstError = responses.find((response) => response?.status === "error");
  const pushDiagnostics = tokens.length
    ? {
        tokens: tokens.length,
        accepted,
        failed,
        first_error: firstError
          ? {
              message: firstError.message ?? null,
              code: firstError.details?.error ?? null
            }
          : null
      }
    : null;

  return new Response(
    JSON.stringify({
      ok: failed === 0,
      sent: accepted,
      attempted: tokens.length,
      token_filter: "app_ownership in (standalone,bare)",
      diagnostics,
      push_diagnostics: pushDiagnostics,
      message: tokens.length
        ? accepted
          ? "Notification accepted by Expo push service."
          : "Notification was not accepted by Expo push service."
        : "No installed app tokens found. Users must open the latest installed build and allow notifications."
    }),
    {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
});
