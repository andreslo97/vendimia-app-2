-- Limpieza de datos semilla duplicados por ejecutar database.sql mas de una vez.
-- Ejecutar en Supabase/Navicat sobre el esquema public.
-- Conserva el registro mas reciente de cada grupo funcional y elimina duplicados.

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(app_label, ''), coalesce(title, ''), coalesce(subtitle, '')
      order by id desc
    ) as rn
  from public.home_header
)
delete from public.home_header
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(subtitle, ''), coalesce(button_route, '')
      order by id desc
    ) as rn
  from public.home_banners
)
delete from public.home_banners
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(verse, ''), coalesce(reference, '')
      order by id desc
    ) as rn
  from public.daily_words
)
delete from public.daily_words
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(label, '')
      order by id desc
    ) as rn
  from public.home_stats
)
delete from public.home_stats
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(section_key, '')
      order by id desc
    ) as rn
  from public.home_sections
)
delete from public.home_sections
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(route, '')
      order by id desc
    ) as rn
  from public.home_quick_links
)
delete from public.home_quick_links
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(event_date::text, ''), coalesce(event_time, ''), coalesce(location, '')
      order by id desc
    ) as rn
  from public.events
)
delete from public.events
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, '')
      order by id desc
    ) as rn
  from public.devotionals
)
delete from public.devotionals
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(description, '')
      order by id desc
    ) as rn
  from public.prayer_highlights
)
delete from public.prayer_highlights
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(subtitle, '')
      order by id desc
    ) as rn
  from public.prayer_screen_content
)
delete from public.prayer_screen_content
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(app_label, ''), coalesce(title, ''), coalesce(subtitle, '')
      order by id desc
    ) as rn
  from public.discipleship_header
)
delete from public.discipleship_header
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(route, '')
      order by id desc
    ) as rn
  from public.discipleship_modules
)
delete from public.discipleship_modules
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(storage_path, '')
      order by id desc
    ) as rn
  from public.discipleship_materials
)
delete from public.discipleship_materials
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(subtitle, '')
      order by id desc
    ) as rn
  from public.discipleship_notes_content
)
delete from public.discipleship_notes_content
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(subtitle, '')
      order by id desc
    ) as rn
  from public.bible_screen_content
)
delete from public.bible_screen_content
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(abbreviation, ''), coalesce(viewer_url, '')
      order by id desc
    ) as rn
  from public.bible_versions
)
delete from public.bible_versions
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(title, ''), coalesce(subtitle, '')
      order by id desc
    ) as rn
  from public.devotional_screen_content
)
delete from public.devotional_screen_content
where id in (select id from ranked where rn > 1);

with ranked as (
  select
    id,
    row_number() over (
      partition by coalesce(passage_reference, ''), coalesce(viewer_url, '')
      order by id desc
    ) as rn
  from public.devotional_passages
)
delete from public.devotional_passages
where id in (select id from ranked where rn > 1);
