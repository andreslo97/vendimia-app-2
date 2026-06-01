# Distribucion de pruebas

## Recomendacion

Para Android, usa un APK de pruebas con EAS Build. Expo genera un link que puedes compartir con las personas autorizadas.

Para iPhone, Apple no permite instalar apps por link libremente como Android. Las opciones son Expo Go para pruebas rapidas o TestFlight si tienes cuenta Apple Developer.

## Android APK por link

```bash
cd mobile
npx eas login
npx eas build:configure
npx eas build --platform android --profile preview
```

Cuando termine, EAS mostrara un link. Ese link permite descargar el APK en Android.

## iPhone con Expo Go

```bash
cd mobile
npx expo start -c
```

Comparte el QR o el link de Expo. La persona debe instalar Expo Go.

## Web como link publico

Tambien puedes publicar la version web en Vercel, Netlify o EAS Hosting. Sirve para probar la interfaz desde cualquier navegador, pero no instala una app nativa.

## Variables

Antes de construir, verifica que `mobile/.env` tenga:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```
