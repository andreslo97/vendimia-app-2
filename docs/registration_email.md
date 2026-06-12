# Correo de registro exitoso

La app invoca la Edge Function `send-registration-email` despues de crear una cuenta con Supabase Auth.

Este correo es solo informativo. No incluye enlaces ni acciones de confirmacion.

## Configuracion requerida en Supabase

1. En Supabase, ve a `Authentication > Providers > Email`.
2. Desactiva la confirmacion obligatoria por correo si no quieres que Supabase envie un correo con enlace de confirmacion.
3. Configura un proveedor de correo transaccional. La funcion incluida usa Resend.

## Secrets requeridos

Desde la terminal:

```bash
supabase secrets set RESEND_API_KEY=tu_api_key_de_resend
supabase secrets set REGISTRATION_EMAIL_FROM="Iglesia Vendimia Internacional <no-reply@tudominio.com>"
```

El correo `from` debe pertenecer a un dominio verificado en Resend.

## Despliegue

```bash
supabase functions deploy send-registration-email
```

## Comportamiento en la app

Si el correo no se puede enviar, el registro no se bloquea. La cuenta se crea normalmente y el error de envio no se muestra al usuario.
