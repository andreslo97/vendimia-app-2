import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type ScheduleType = "today_events" | "daily_devotional" | "weekly_bible";

type PushToken = {
  user_id: string;
  expo_push_token: string;
};

type MasterRow = {
  id: number;
  notification_key: string;
  title_template: string;
  body_template: string;
  route: string | null;
  is_active: boolean;
  implementation_status: string;
};

const installedAppOwnershipValues = ["standalone", "bare"];

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = Deno.env.get("CRON_SECRET");
const notificationImageUrl = Deno.env.get("NOTIFICATION_IMAGE_URL")?.trim();
const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

  if (userIds) query = query.in("user_id", userIds);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as PushToken[];
};

const interpolate = (template: string, variables: Record<string, string | number>) =>
  template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) =>
    variables[key] === undefined ? `{${key}}` : String(variables[key])
  );

const getMaster = async (notificationKey: string) => {
  const { data, error } = await adminClient
    .from("notification_master")
    .select("id,notification_key,title_template,body_template,route,is_active,implementation_status")
    .eq("notification_key", notificationKey)
    .maybeSingle();

  if (error) throw error;
  return data as MasterRow | null;
};

const sendNotification = async (
  master: MasterRow,
  variables: Record<string, string | number> = {},
  targetRole?: string | null
) => {
  const tokens = await getTokens(targetRole);
  const title = interpolate(master.title_template, variables);
  const body = interpolate(master.body_template, variables);

  const { data: notification, error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      master_id: master.id,
      title,
      body,
      target_role: targetRole ?? null,
      notification_type: master.notification_key,
      route: master.route,
      data: { variables },
      sent_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (notificationError) throw notificationError;

  if (!tokens.length) return { sent: 0 };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token.expo_push_token,
        channelId: "vendimia-general",
        sound: "default",
        title,
        body,
        data: master.route ? { route: master.route } : {},
        ...(notificationImageUrl ? { richContent: { image: notificationImageUrl } } : {})
      }))
    )
  });

  const json = await response.json();
  const responses = Array.isArray(json.data) ? json.data : [json];

  await adminClient.from("notification_deliveries").insert(
    tokens.map((token, index) => ({
      notification_id: notification.id,
      user_id: token.user_id,
      expo_push_token: token.expo_push_token,
      status: responses[index]?.status ?? "sent",
      response: responses[index] ?? null
    }))
  );

  return { sent: tokens.length };
};

const sendMasterNotification = async (
  notificationKey: string,
  variables: Record<string, string | number> = {},
  targetRole?: string | null
) => {
  const master = await getMaster(notificationKey);
  if (!master) return { sent: 0, skipped: "master_not_found" };
  if (!master.is_active) return { sent: 0, skipped: "inactive" };
  if (master.implementation_status !== "ready") return { sent: 0, skipped: "not_ready" };

  return sendNotification(master, variables, targetRole);
};

const sendTodayEvents = async () => {
  return { sent: 0, skipped: "legacy_schedule_disabled" };
};

const sendDailyDevotional = () =>
  sendMasterNotification("daily_devotional_reminder");

const sendWeeklyBible = () =>
  sendMasterNotification("discipleship_weekly_reading");

Deno.serve(async (req) => {
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const type = payload.type as ScheduleType | undefined;

  if (type === "today_events") return Response.json(await sendTodayEvents());
  if (type === "daily_devotional") return Response.json(await sendDailyDevotional());
  if (type === "weekly_bible") return Response.json(await sendWeeklyBible());

  return Response.json({
    today_events: await sendTodayEvents(),
    daily_devotional: await sendDailyDevotional()
  });
});
