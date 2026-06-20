# Panel administrativo

El panel se encuentra en:

```text
Mas > Panel admin
```

Solo aparece para usuarios con:

```text
profiles.role = super_admin
```

## Activar en Supabase

Ejecuta una sola vez el archivo principal:

```text
docs/admin_panel.sql
```

Puedes hacerlo desde el SQL Editor de Supabase o desde Navicat conectado al
proyecto correcto.

Para activar el modulo de canciones semanales, ejecuta tambien:

```text
docs/weekly_songs.sql
```

Si `admin_panel.sql` ya fue ejecutado anteriormente, no hay problema:
`weekly_songs.sql` agrega sus propias politicas administrativas.

Para activar la cancion publica reproducible de Inicio, ejecuta:

```text
docs/home_featured_song.sql
```

El script crea:

- Validacion centralizada del rol `super_admin`.
- Politicas RLS para administrar contenido desde la app.
- Gestion segura de roles y permisos mediante una funcion RPC.
- Tabla `admin_audit_logs` para registrar cambios administrativos.

## Modulos disponibles

- Inicio: encabezado, banner y palabra del dia.
- Devocional diario: contenido publicado para la fecha actual.
- Eventos: crear, editar, destacar y desactivar.
- Usuarios y roles: rol y permiso para gestionar citas.
- Citas pastorales: acceso al modulo existente de respuestas.
- Cronograma liderazgo: encabezado, responsables, orden y estado.
- Cancion de Inicio: fragmento publico con portada, URL de audio y duración
  configurable de 1 a 60 segundos.
- Canciones semanales: repertorio interno, artistas, tonalidades y referencias.
- Sedes e informacion: datos institucionales y sedes existentes.
- Notificaciones: envios manuales, automatizaciones e historial.
- Estado del sistema: usuarios, tokens, trabajos y pendientes.

## Seguridad

No agregues la `service_role` de Supabase a la aplicacion movil. El panel usa
la sesion del usuario autenticado y las politicas RLS validan el rol en la
base de datos.
