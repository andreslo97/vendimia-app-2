-- Edicion y borrado logico para notas personales y devocionales.

alter table public.discipleship_notes
add column if not exists is_active boolean not null default true;

alter table public.discipleship_notes
add column if not exists updated_at timestamptz not null default now();

alter table public.devotional_notes
add column if not exists is_active boolean not null default true;

alter table public.devotional_notes
add column if not exists updated_at timestamptz not null default now();

drop policy if exists "discipleship_notes_delete_own" on public.discipleship_notes;
drop policy if exists "devotional_notes_delete_own" on public.devotional_notes;
