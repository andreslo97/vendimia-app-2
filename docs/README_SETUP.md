# Vendimia App 2.0

## Requisitos

- Node.js LTS
- Expo Go instalado en iOS o Android
- Proyecto Supabase creado

## Instalacion

```bash
cd mobile
npm install
```

## Variables de entorno

Copia `mobile/.env.example` como `mobile/.env` y completa:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Base de datos

Ejecuta el archivo `docs/database.sql` en Supabase SQL Editor o desde Navicat conectado a tu proyecto Supabase.

El script crea tablas, trigger automatico para `profiles`, politicas RLS e inserts iniciales parametrizados.

Si ya ejecutaste `docs/database.sql` antes de agregar el modulo de Oracion comunitaria, ejecuta tambien `docs/prayer_requests.sql`.

Si ya ejecutaste `docs/database.sql` antes de agregar materiales de discipulado, ejecuta tambien `docs/discipleship_materials.sql`.

Si ya ejecutaste `docs/database.sql` antes de agregar notas personales, ejecuta tambien `docs/discipleship_notes.sql`.

Si ya ejecutaste `docs/database.sql` antes de agregar el visor de Biblia, ejecuta tambien `docs/bible_versions.sql`.

Si ya ejecutaste `docs/database.sql` antes de agregar devocionales con busqueda y notas, ejecuta tambien `docs/devotional_passages.sql`.

Si ya ejecutaste `docs/devotional_passages.sql` antes de convertir devocionales a notas personales por versiculo/capitulo, ejecuta tambien `docs/devotional_notes_personal.sql`.

Si ya ejecutaste `docs/database.sql` antes del rediseño de Inicio, ejecuta tambien `docs/home_redesign.sql`.

Las imagenes de Inicio se cambian desde `home_banners.image_url` y `events.image_url`. Puedes usar URLs publicas o archivos subidos a Supabase Storage con URL publica.

Los dos eventos del Inicio se controlan desde `events.show_on_home = true` y se ordenan con `events.home_sort_order`. Mantener solo dos eventos activos con `show_on_home`.

Si ya ejecutaste `docs/database.sql` antes de agregar informacion institucional, ejecuta tambien `docs/church_info.sql`.

Para subir la cartilla:

1. Entra a Supabase > Storage.
2. Abre el bucket privado `discipleship-materials`.
3. Sube el archivo PDF con este nombre exacto: `cartilla-discipulado-personal.pdf`.
4. En `public.profiles`, cambia a `lider` el `role` del usuario que debe abrirlo.

La app abre el PDF en un visor interno. En Android se usa Google Docs Viewer dentro de WebView porque el WebView del sistema no siempre renderiza PDF directo; el boton superior derecho permite abrirlo externamente si el visor no carga.

## Correos de registro

Para que Supabase envie correo al crear una cuenta:

1. Entra a Supabase.
2. Ve a Authentication > Providers > Email.
3. Activa Confirm email.
4. Ve a Authentication > Email Templates > Confirm signup.
5. Ajusta el asunto y cuerpo del correo para indicar que el registro fue exitoso.

La app ya envia `emailRedirectTo` al registrar usuarios, para volver a `/auth/login` despues de confirmar.

## Ejecutar

```bash
cd mobile
npm install
npx expo start -c
```

## Probar en Expo Go

1. Ejecuta `npx expo start -c`.
2. Escanea el QR con Expo Go.
3. Crea una cuenta desde la pantalla de registro.
4. Verifica que Supabase Auth cree el usuario y que el trigger llene `public.profiles`.
5. Inicia sesion y valida las cinco tabs.

## Web

```bash
cd mobile
npx expo start --web -c
```
