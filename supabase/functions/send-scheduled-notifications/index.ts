import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type ScheduleType = "today_events" | "daily_devotional" | "weekly_bible";

type PushToken = {
  user_id: string;
  expo_push_token: string;
};

const installedAppOwnershipValues = ["standalone", "bare"];

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = Deno.env.get("CRON_SECRET");
const notificationImageUrl = Deno.env.get("NOTIFICATION_IMAGE_URL")?.trim();
const adminClient = createClient(supabaseUrl, serviceRoleKey);

const getColombiaDate = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bogota"
  });

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

const sendNotification = async (title: string, body: string, notificationType: string, targetRole?: string | null) => {
  const tokens = await getTokens(targetRole);

  const { data: notification, error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      title,
      body,
      target_role: targetRole ?? null,
      notification_type: notificationType,
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

const sendTodayEvents = async () => {
  const today = getColombiaDate();
  const { data: events, error } = await adminClient
    .from("events")
    .select("title,event_time,location")
    .eq("is_active", true)
    .eq("event_date", today)
    .order("event_time", { ascending: true });

  if (error) throw error;
  if (!events?.length) return { sent: 0, skipped: "no_events" };

  const firstEvent = events[0];
  const title = events.length === 1 ? "Hoy tenemos evento" : `Hoy tenemos ${events.length} eventos`;
  const body =
    events.length === 1
      ? `${firstEvent.title}${firstEvent.event_time ? ` a las ${firstEvent.event_time}` : ""}${firstEvent.location ? ` en ${firstEvent.location}` : ""}.`
      : "Revisa el apartado Eventos para ver la programación de hoy.";

  return sendNotification(title, body, "today_events");
};

const sendDailyDevotional = () =>
  sendNotification(
    "¿Ya hiciste tu devocional diario?",
    "Recuerda que puedes escribir tus notas devocionales en la app.",
    "daily_devotional"
  );

const sendWeeklyBible = () =>
  sendNotification(
    "La Biblia está disponible en la app",
    "Puedes leer distintas versiones desde Discipulado > Biblia.",
    "weekly_bible"
  );

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
