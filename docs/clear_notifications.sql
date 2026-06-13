-- Limpieza manual del historial de notificaciones.
-- Ejecutar en Supabase SQL Editor solo cuando se quiera borrar el historial.
-- No elimina tokens de dispositivos en public.user_push_tokens.

begin;

truncate table public.notifications, public.notification_deliveries restart identity;

commit;
