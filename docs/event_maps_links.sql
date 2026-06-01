alter table public.events
add column if not exists maps_url text;

comment on column public.events.maps_url is 'Google Maps URL opened when a user taps the event card.';

-- Actualiza cada evento con su link real de Google Maps.
-- Puedes identificarlo por id, title o cualquier criterio que prefieras.
--
-- Ejemplo:
-- update public.events
-- set maps_url = 'https://www.google.com/maps/search/?api=1&query=Auditorio%20Punto%20Clave%20Medellin'
-- where id = 1;
