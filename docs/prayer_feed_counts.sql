drop trigger if exists on_prayer_like_insert_success on public.prayer_request_likes;
drop trigger if exists on_prayer_like_delete_success on public.prayer_request_likes;
drop trigger if exists on_prayer_like_set_user_id on public.prayer_request_likes;
drop trigger if exists on_prayer_request_like_set_user_id on public.prayer_request_likes;

drop function if exists public.log_prayer_like_insert_success();
drop function if exists public.log_prayer_like_delete_success();
drop function if exists public.debug_insert_prayer_like(bigint);
drop function if exists public.set_prayer_like_user_id();

drop table if exists public.prayer_like_action_logs;

grant select, insert, update on public.prayer_requests to authenticated;
grant select, insert, delete on public.prayer_request_likes to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "prayer_request_likes_read" on public.prayer_request_likes;
create policy "prayer_request_likes_read"
on public.prayer_request_likes for select
to authenticated
using (true);

drop policy if exists "prayer_request_likes_insert_own" on public.prayer_request_likes;
create policy "prayer_request_likes_insert_own"
on public.prayer_request_likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prayer_request_likes_delete_own" on public.prayer_request_likes;
create policy "prayer_request_likes_delete_own"
on public.prayer_request_likes for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.get_prayer_feed()
returns table (
  id bigint,
  user_id uuid,
  body text,
  created_at timestamptz,
  like_count bigint,
  liked_by_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    prayer_requests.id,
    prayer_requests.user_id,
    prayer_requests.body,
    prayer_requests.created_at,
    count(prayer_request_likes.id)::bigint as like_count,
    exists (
      select 1
      from public.prayer_request_likes current_user_like
      where current_user_like.request_id = prayer_requests.id
        and current_user_like.user_id = auth.uid()
    ) as liked_by_me
  from public.prayer_requests
  left join public.prayer_request_likes
    on prayer_request_likes.request_id = prayer_requests.id
  where prayer_requests.is_active = true
  group by
    prayer_requests.id,
    prayer_requests.user_id,
    prayer_requests.body,
    prayer_requests.created_at
  order by prayer_requests.created_at desc;
$$;

grant execute on function public.get_prayer_feed() to authenticated;
