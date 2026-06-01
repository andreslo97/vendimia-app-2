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
  body: string;
  created_at: string;
  likeCount: number;
  likedByMe: boolean;
};

export type PrayerData = {
  content: PrayerScreenContent | null;
  requests: PrayerRequestItem[];
};

type PrayerRequestRow = {
  id: number;
  body: string;
  created_at: string;
};

type PrayerLikeRow = {
  request_id: number;
  user_id: string;
};

const unwrap = <T>(result: { data: T; error: Error | null }) => {
  if (result.error) throw result.error;
  return result.data;
};

export async function getPrayerData(userId: string): Promise<PrayerData> {
  const [contentResult, requestsResult, likesResult] = await Promise.all([
    supabase
      .from("prayer_screen_content")
      .select("title,subtitle,input_placeholder,button_text,empty_text,like_text,unlike_text")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("prayer_requests")
      .select("id,body,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("prayer_request_likes").select("request_id,user_id")
  ]);

  const content = unwrap(contentResult);
  const requests = unwrap(requestsResult) ?? [];
  const likes = unwrap(likesResult) ?? [];
  const likeCounts = new Map<number, number>();
  const likedByMe = new Set<number>();

  (likes as PrayerLikeRow[]).forEach((like) => {
    likeCounts.set(like.request_id, (likeCounts.get(like.request_id) ?? 0) + 1);
    if (like.user_id === userId) {
      likedByMe.add(like.request_id);
    }
  });

  return {
    content,
    requests: (requests as PrayerRequestRow[]).map((request) => ({
      id: request.id,
      body: request.body,
      created_at: request.created_at,
      likeCount: likeCounts.get(request.id) ?? 0,
      likedByMe: likedByMe.has(request.id)
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

  const { error } = await supabase.from("prayer_request_likes").insert({
    request_id: requestId,
    user_id: userId
  });

  if (error) throw error;
}
