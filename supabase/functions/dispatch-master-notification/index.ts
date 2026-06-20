import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type DispatchEvent =
  | "daily_devotional_published"
  | "appointment_created"
  | "appointment_updated";

type RequestBody = {
  event?: DispatchEvent;
  appointmentId?: number;
  devotionalDate?: string;
};

type MasterRow = {
  id: number;
  notification_key: string;
  audience_type: string;
  target_role: string | null;
  title_template: string;
  body_template: string;
  route: string | null;
  priority: string;
  is_active: boolean;
  implementation_status: string;
};

type PushToken = {
  user_id: string;
  expo_push_token: string;
};

const installedAppOwnershipValues = ["standalone", "bare"];
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const notificationImageUrl = Deno.env.get("NOTIFICATION_IMAGE_URL")?.trim();
const adminClient = createClient(supabaseUrl, serviceRoleKey);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

const getAuthenticatedUser = async (authorization: string | null) => {
  if (!authorization) return null;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  const token = authorization.replace("Bearer ", "");
  const { data, error } = await authClient.auth.getUser(token);

  if (error) return null;
  return data.user;
};

const getProfile = async (userId: string) => {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id,role,can_manage_appointments")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

const interpolate = (template: string, variables: Record<string, string | number>) =>
  template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) =>
    variables[key] === undefined ? `{${key}}` : String(variables[key])
  );

const getMaster = async (notificationKey: string) => {
  const { data, error } = await adminClient
    .from("notification_master")
    .select("id,notification_key,audience_type,target_role,title_template,body_template,route,priority,is_active,implementation_status")
    .eq("notification_key", notificationKey)
    .maybeSingle();

  if (error) throw error;
  return data as MasterRow | null;
};

const getManagerIds = async () => {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id")
    .eq("can_manage_appointments", true);

  if (error) throw error;
  return (data ?? []).map((profile) => profile.id as string);
};

const getAllTokenUserIds = async () => {
  const { data, error } = await adminClient
    .from("user_push_tokens")
    .select("user_id")
    .eq("is_active", true)
    .in("app_ownership", installedAppOwnershipValues);

  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.user_id as string))];
};

const getTokens = async (recipientIds: string[]) => {
  if (!recipientIds.length) return [] as PushToken[];

  const { data, error } = await adminClient
    .from("user_push_tokens")
    .select("user_id,expo_push_token")
    .eq("is_active", true)
    .in("app_ownership", installedAppOwnershipValues)
    .in("user_id", recipientIds);

  if (error) throw error;
  return (data ?? []) as PushToken[];
};

const sendPush = async (
  tokens: PushToken[],
  title: string,
  body: string,
  route: string | null,
  data: Record<string, unknown>
) => {
  if (!tokens.length) return [];

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token.expo_push_token,
        channelId: "vendimia-general",
        sound: "default",
        title,
        body,
        data: { ...data, route },
        ...(notificationImageUrl ? { richContent: { image: notificationImageUrl } } : {})
      }))
    )
  });

  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [json];
};

const dispatchMaster = async ({
  notificationKey,
  recipientIds,
  variables,
  sourceType,
  sourceId
}: {
  notificationKey: string;
  recipientIds: string[];
  variables: Record<string, string | number>;
  sourceType: string;
  sourceId: string;
}) => {
  const master = await getMaster(notificationKey);
  if (!master) return { key: notificationKey, skipped: "master_not_found", sent: 0 };
  if (!master.is_active) return { key: notificationKey, skipped: "inactive", sent: 0 };
  if (master.implementation_status !== "ready") return { key: notificationKey, skipped: "not_ready", sent: 0 };

  const uniqueRecipients = [...new Set(recipientIds)];
  if (!uniqueRecipients.length) {
    return { key: notificationKey, skipped: "no_recipients", sent: 0 };
  }

  const idempotencyKeys = uniqueRecipients.map(
    (userId) => `${notificationKey}:${sourceType}:${sourceId}:${userId}`
  );

  const { data: existingJobs, error: existingJobsError } = await adminClient
    .from("notification_jobs")
    .select("idempotency_key")
    .in("idempotency_key", idempotencyKeys);

  if (existingJobsError) throw existingJobsError;

  const existingKeys = new Set((existingJobs ?? []).map((job) => job.idempotency_key as string));
  const pendingRecipients = uniqueRecipients.filter(
    (userId) => !existingKeys.has(`${notificationKey}:${sourceType}:${sourceId}:${userId}`)
  );

  if (!pendingRecipients.length) {
    return { key: notificationKey, skipped: "duplicate", sent: 0 };
  }

  const { data: jobs, error: jobsError } = await adminClient
    .from("notification_jobs")
    .insert(
      pendingRecipients.map((userId) => ({
        master_id: master.id,
        recipient_user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        variables,
        scheduled_for: new Date().toISOString(),
        status: "processing",
        attempts: 1,
        idempotency_key: `${notificationKey}:${sourceType}:${sourceId}:${userId}`
      }))
    )
    .select("id,recipient_user_id");

  if (jobsError) throw jobsError;

  const title = interpolate(master.title_template, variables);
  const body = interpolate(master.body_template, variables);
  const tokens = await getTokens(pendingRecipients);

  const { data: notification, error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      master_id: master.id,
      title,
      body,
      notification_type: master.notification_key,
      target_user_id: pendingRecipients.length === 1 ? pendingRecipients[0] : null,
      route: master.route,
      data: { variables, sourceType, sourceId },
      sent_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (notificationError) throw notificationError;

  const responses = await sendPush(tokens, title, body, master.route, {
    notificationKey,
    sourceType,
    sourceId
  });

  if (tokens.length) {
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

  const usersWithTokens = new Set(tokens.map((token) => token.user_id));
  await Promise.all(
    (jobs ?? []).map((job) =>
      adminClient
        .from("notification_jobs")
        .update({
          status: usersWithTokens.has(job.recipient_user_id) ? "sent" : "failed",
          last_error: usersWithTokens.has(job.recipient_user_id) ? null : "No active installed push token",
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", job.id)
    )
  );

  return {
    key: notificationKey,
    recipients: pendingRecipients.length,
    tokens: tokens.length,
    sent: responses.filter((response) => response?.status === "ok").length
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const user = await getAuthenticatedUser(req.headers.get("Authorization"));
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const payload = (await req.json()) as RequestBody;
    const profile = await getProfile(user.id);

    if (payload.event === "daily_devotional_published") {
      if (profile.role !== "super_admin") return jsonResponse({ error: "Forbidden" }, 403);
      if (!payload.devotionalDate) return jsonResponse({ error: "devotionalDate is required" }, 400);

      const { data: devotional, error } = await adminClient
        .from("daily_devotionals")
        .select("id,devotional_date,title")
        .eq("devotional_date", payload.devotionalDate)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      const recipientIds = await getAllTokenUserIds();
      return jsonResponse({
        results: [
          await dispatchMaster({
            notificationKey: "daily_devotional_available",
            recipientIds,
            variables: { titulo: devotional.title },
            sourceType: "daily_devotional",
            sourceId: devotional.devotional_date
          })
        ]
      });
    }

    if (payload.event === "appointment_created") {
      if (!payload.appointmentId) return jsonResponse({ error: "appointmentId is required" }, 400);

      const { data: appointment, error } = await adminClient
        .from("pastor_appointments")
        .select("id,user_id,appointment_date,appointment_time,created_at")
        .eq("id", payload.appointmentId)
        .single();

      if (error) throw error;
      if (appointment.user_id !== user.id) return jsonResponse({ error: "Forbidden" }, 403);

      const variables = {
        fecha: appointment.appointment_date,
        hora: String(appointment.appointment_time).slice(0, 5)
      };
      const managerIds = await getManagerIds();

      return jsonResponse({
        results: [
          await dispatchMaster({
            notificationKey: "appointment_received",
            recipientIds: [appointment.user_id],
            variables,
            sourceType: "pastor_appointment_created_user",
            sourceId: `${appointment.id}:${appointment.created_at}`
          }),
          await dispatchMaster({
            notificationKey: "appointment_new_manager",
            recipientIds: managerIds,
            variables,
            sourceType: "pastor_appointment_created_manager",
            sourceId: `${appointment.id}:${appointment.created_at}`
          })
        ]
      });
    }

    if (payload.event === "appointment_updated") {
      if (!profile.can_manage_appointments) return jsonResponse({ error: "Forbidden" }, 403);
      if (!payload.appointmentId) return jsonResponse({ error: "appointmentId is required" }, 400);

      const { data: appointment, error } = await adminClient
        .from("pastor_appointments")
        .select("id,user_id,appointment_date,appointment_time,status,response_message,updated_at")
        .eq("id", payload.appointmentId)
        .single();

      if (error) throw error;

      const notificationKey =
        appointment.status === "aceptada"
          ? "appointment_accepted"
          : appointment.status === "rechazada"
            ? "appointment_rejected"
            : "appointment_response_updated";

      return jsonResponse({
        results: [
          await dispatchMaster({
            notificationKey,
            recipientIds: [appointment.user_id],
            variables: {
              fecha: appointment.appointment_date,
              hora: String(appointment.appointment_time).slice(0, 5)
            },
            sourceType: "pastor_appointment_updated",
            sourceId: `${appointment.id}:${appointment.updated_at}`
          })
        ]
      });
    }

    return jsonResponse({ error: "Unsupported event" }, 400);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500
    );
  }
});
