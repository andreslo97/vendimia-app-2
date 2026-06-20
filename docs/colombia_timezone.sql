-- Zona horaria oficial del proyecto.
-- PostgreSQL conserva timestamptz internamente en UTC y los presenta en esta zona.

alter database postgres set timezone to 'America/Bogota';
set timezone to 'America/Bogota';

alter table if exists public.discipleship_notes
alter column note_date set default ((now() at time zone 'America/Bogota')::date);

alter table if exists public.devotional_notes
alter column note_date set default ((now() at time zone 'America/Bogota')::date);

alter table if exists public.daily_devotionals
alter column devotional_date set default ((now() at time zone 'America/Bogota')::date);

-- Validacion. La hora local debe corresponder a Colombia.
select
  current_setting('timezone') as database_timezone,
  now() as current_timestamp_colombia,
  (now() at time zone 'America/Bogota')::date as current_date_colombia;
