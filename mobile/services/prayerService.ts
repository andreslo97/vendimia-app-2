import { supabase } from "./supabase";

export type PrayerScreenContent = {
  title: string | null;
  subtitle: string | null;
  input_placeholder: string | null;
  button_text: string | null;
  empty_text: string | null;
  like_text: string | null;
  unlike_text: string | null;
};

export type PrayerRequestItem = {
  id: number;
  userId: string;
  body: string;
  created_at: string;
  likeCount: number;
  likedByMe: boolean;
};

export type PrayerData = {
  content: PrayerScreenContent | null;
  requests: PrayerRequestItem[];
};

type PrayerFeedRow = {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  like_count: number | string | null;
  liked_by_me: boolean | null;
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

async function logPrayerRequestAction(
  userId: string,
  requestId: number,
  status: "success" | "error" | "not_found",
  errorMessage?: string,
  metadata?: Record<string, unknown>
) {
  await supabase
    .from("prayer_request_action_logs")
    .insert({
      user_id: userId,
      request_id: requestId,
      action: "mark_answered_client",
      status,
      error_message: errorMessage ?? null,
      metadata: metadata ?? {}
    })
    .throwOnError();
}

export async function getPrayerData(userId: string): Promise<PrayerData> {
  const [contentResult, feedResult] = await Promise.all([
    supabase
      .from("prayer_screen_content")
      .select("title,subtitle,input_placeholder,button_text,empty_text,like_text,unlike_text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("get_prayer_feed")
  ]);

  const content = unwrap(contentResult);
  const feed = unwrap(feedResult) ?? [];

  return {
    content,
    requests: (feed as PrayerFeedRow[]).map((request) => ({
      id: request.id,
      userId: request.user_id,
      body: request.body,
      created_at: request.created_at,
      likeCount: Number(request.like_count ?? 0),
      likedByMe: Boolean(request.liked_by_me)
    }))
  };
}

export async function createPrayerRequest(userId: string, body: string) {
  const { error } = await supabase.from("prayer_requests").insert({
    user_id: userId,
    body
  });

  if (error) throw error;
}

export async function markPrayerRequestAnswered(requestId: number, userId: string) {
  const { data, error } = await supabase.rpc("mark_prayer_request_answered", {
    target_request_id: requestId
  });

  if (error) {
    await logPrayerRequestAction(userId, requestId, "error", error.message, {
      source: "client",
      code: error.code,
      details: error.details,
      hint: error.hint
    }).catch(() => undefined);

    throw error;
  }

  if (data === false) {
    const message = "No encontramos un motivo activo asociado a tu usuario.";
    await logPrayerRequestAction(userId, requestId, "not_found", message, { source: "client" }).catch(() => undefined);
    throw new Error(message);
  }

  await logPrayerRequestAction(userId, requestId, "success", undefined, { source: "client" }).catch(() => undefined);
}

export async function togglePrayerLike(requestId: number, userId: string, likedByMe: boolean) {
  if (likedByMe) {
    const { error } = await supabase
      .from("prayer_request_likes")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", userId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("prayer_request_likes").upsert(
    {
      request_id: requestId,
      user_id: userId
    },
    {
      onConflict: "request_id,user_id",
      ignoreDuplicates: true
    }
  );

  if (error) throw error;
}
