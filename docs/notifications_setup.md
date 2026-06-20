# Notificaciones push

Este modulo usa:

- `expo-notifications` en la app movil.
- Supabase PostgreSQL para tokens, notificaciones y trazabilidad de entregas.
- Supabase Edge Functions para enviar notificaciones.
- Rol administrador poderoso: `public.profiles.role = 'super_admin'`.

## 0. Zona horaria

Ejecuta una vez:

```sql
-- docs/colombia_timezone.sql
```

Los campos `timestamptz` se conservan internamente como instantes UTC, que es el comportamiento correcto de PostgreSQL, y se presentan en `America/Bogota`. Los campos de tipo `date` usan explicitamente la fecha de Colombia.

## 1. Ejecutar SQL

Ejecuta en Supabase/Navicat:

```sql
-- docs/notifications.sql
-- docs/notification_master.sql
```

`notification_master.sql` crea el catalogo MASTER, la cola `notification_jobs` y carga las 29 reglas iniciales. Las reglas con `implementation_status = 'planned'` quedan desactivadas hasta implementar su disparador.

Para convertir un usuario en super administrador:

```sql
update public.profiles
set role = 'super_admin'
where email = 'correo@dominio.com';
```

## 2. Secrets requeridos

Configura estos secrets en Supabase:

```bash
supabase secrets set SUPABASE_URL="https://TU_PROYECTO.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="TU_ANON_KEY"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
supabase secrets set CRON_SECRET="un_valor_largo_y_privado"
supabase secrets set NOTIFICATION_IMAGE_URL="https://TU_URL_PUBLICA/vendimia-logo-orange.png"
```

`SUPABASE_SERVICE_ROLE_KEY` nunca debe ir en la app movil.

`NOTIFICATION_IMAGE_URL` es opcional. Si se configura, las notificaciones se envian con esa imagen usando `richContent.image`. Debe ser una URL publica HTTPS; puede venir de Supabase Storage o de un CDN. Para mostrar exactamente el logo naranja, sube `mobile/assets/vendimia-logo-orange.png` a un bucket publico y usa su public URL.

## 3. Desplegar funciones

```bash
supabase functions deploy send-push-notification
supabase functions deploy send-scheduled-notifications
supabase functions deploy dispatch-master-notification
```

## 4. Cron sugerido

En Supabase puedes crear schedules para llamar `send-scheduled-notifications`.

Headers:

```text
x-cron-secret: tu_valor_de_CRON_SECRET
Content-Type: application/json
```

Eventos del dia, todos los dias 8:00 AM Colombia:

```json
{ "type": "today_events" }
```

Devocional diario, todos los dias 7:00 PM Colombia:

```json
{ "type": "daily_devotional" }
```

Recordatorio Biblia, lunes 9:00 AM Colombia:

```json
{ "type": "weekly_bible" }
```

## 5. Panel admin

El panel aparece en `Mas > Panel admin` solo si el usuario autenticado tiene:

```text
profiles.role = super_admin
```

Desde ese panel se puede:

- Enviar una notificacion manual a todos o a un rol.
- Publicar o editar el devocional diario.
- Activar o desactivar reglas de `notification_master`.

Automatizaciones conectadas inicialmente:

- Devocional diario publicado.
- Confirmacion de solicitud de cita para el solicitante.
- Nueva cita para usuarios con `can_manage_appointments = true`.
- Cita aceptada.
- Cita rechazada.
- Actualizacion de respuesta de cita.

Las demas reglas quedan sembradas en MASTER con estado planificado.

## 6. Nueva build requerida

Como se agrego `expo-notifications`, debes generar una nueva build Android/iOS para probar push notifications en dispositivos reales.

## 7. Verificar tokens de app instalada

Expo Go puede registrar tokens con `app_ownership = 'expo'`, `storeClient` o valores similares segun la version de Expo.

La app instalada desde Play Store/EAS/APK debe registrar tokens con alguno de estos valores:

```text
app_ownership = standalone
app_ownership = bare
```

Para validar una APK Android, abre la app instalada, inicia sesion y toca `Registrar este dispositivo` desde el panel admin. El resultado esperado en `user_push_tokens` es:

```text
platform = android
app_ownership = standalone
```

Tambien es valido `app_ownership = bare` si la build reporta entorno bare.

Si el valor aparece como `unknown`, el usuario debe instalar una build nueva, abrir la app, iniciar sesion y aceptar permisos de notificacion para que el token se registre nuevamente.

Consulta de diagnostico:

```sql
select
  profiles.email,
  user_push_tokens.platform,
  user_push_tokens.app_ownership,
  user_push_tokens.device_name,
  user_push_tokens.is_active,
  user_push_tokens.updated_at
from public.user_push_tokens
join public.profiles on profiles.id = user_push_tokens.user_id
order by user_push_tokens.updated_at desc;
```

Las Edge Functions envian notificaciones solo a tokens `standalone` o `bare`, para evitar entregar mensajes a Expo Go/dev client.

Si un usuario no recibe notificaciones:

1. Debe instalar la build actual desde Play Store/Test.
2. Abrir la app.
3. Iniciar sesion.
4. Aceptar permisos de notificaciones.
5. Confirmar que aparece un token `standalone` o `bare` en `user_push_tokens`.
