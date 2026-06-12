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

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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
    .eq("is_active", true);

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

const sendExpoPush = async (tokens: PushToken[], title: string, body: string) => {
  const messages = tokens.map((token) => ({
    to: token.expo_push_token,
    sound: "default",
    title,
    body
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
  return Array.isArray(json.data) ? json.data : [json];
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

  const tokens = await getTokens(targetRole);
  const { data: notification, error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      title,
      body,
      target_role: targetRole,
      notification_type: "manual",
      sent_at: new Date().toISOString(),
      created_by: admin.userId
    })
    .select("id")
    .single();

  if (notificationError) throw notificationError;

  const responses = await sendExpoPush(tokens, title, body);

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

  return new Response(JSON.stringify({ ok: true, sent: tokens.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
