-- Tono naranja unico de la app.
-- Ejecuta este script para alinear el contenido parametrizado existente.

update public.home_banners
set accent_color = '#F9820B'
where accent_color is not null;

update public.daily_words
set accent_color = '#F9820B'
where accent_color is not null;

update public.home_quick_links
set accent_color = '#F9820B'
where accent_color is not null;

update public.events
set accent_color = '#F9820B'
where accent_color is not null;

update public.discipleship_modules
set accent_color = '#F9820B'
where accent_color is not null;
