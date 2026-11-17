# Plan de Supabase para producción (ítem 13)

El plan **Free sirve para desarrollo, no para una app publicada**:

- Los proyectos gratuitos se **pausan tras un periodo de inactividad** y hay que reactivarlos a mano. Los cron de AFFutbol generan tráfico, pero no es razón para depender de ese comportamiento: si el proyecto se pausa, caen el login, las predicciones, los rankings y las notificaciones a la vez.
- El plan Free **no incluye copias de seguridad automáticas**. Un borrado accidental o una migración fallida no se puede deshacer.
- El SMTP gratuito tiene límites de prueba, insuficientes para confirmaciones de correo y reseteos de contraseña reales.

## Antes del lanzamiento

- [ ] Pasar el proyecto a **Supabase Pro**. Es el requisito mínimo para producción; incluye copias diarias y evita la pausa por inactividad. Contratar **Point-in-Time Recovery (PITR)** si se quiere recuperar un momento concreto (es un extra).
- [ ] Verificar la región del proyecto (preferiblemente dentro de la UE, por RGPD) y reflejarla en la política de privacidad. Cambiar de región después de crear el proyecto no es trivial.
- [ ] Configurar **SMTP propio** (Resend, SendGrid, etc.) en Authentication → SMTP y comprobar los correos de confirmación y de reset de contraseña.
- [ ] Comprobar que las copias están activas y hacer una **prueba de restauración** en un proyecto nuevo antes de publicar.
- [ ] Poner un límite de gasto (spend cap) y avisos de facturación.
- [ ] Quitar `exp://**` de Authentication → URL Configuration y dejar solo `affutbol://**` (más la URL web de la app si se usa el flujo web).
- [ ] Publicar el consent screen de Google y subir la APNs key a EAS; sin ella no hay push en iOS ni Apple Sign In.

## Funciones y secretos (recordatorio)

| Función | Despliegue | Autenticación |
| --- | --- | --- |
| `api-football` | `npx supabase functions deploy api-football` | JWT del usuario (verify_jwt = true) |
| `delete-account` | `npx supabase functions deploy delete-account` | JWT del usuario (verify_jwt = true) |
| `news-refresh` | `npx supabase functions deploy news-refresh` | JWT / service role |
| `settle-predictions` | `npx supabase functions deploy settle-predictions --no-verify-jwt` | `x-settle-secret` |
| `send-push` | `npx supabase functions deploy send-push --no-verify-jwt` | `x-notify-secret` |
| `sync-statistics` | `npx supabase functions deploy sync-statistics --no-verify-jwt` | `x-statistics-secret` |

Secretos de servidor (nunca `EXPO_PUBLIC_*`): `API_FOOTBALL_KEY`, `FOOTBALL_DATA_TOKEN`, `WIKI_USER_AGENT`, `PREDICTIONS_SETTLE_SECRET`, `PUSH_NOTIFY_SECRET`, `STATISTICS_SYNC_SECRET`, más los valores espejo de Supabase Vault (`settle_secret`, `notify_secret`, `statistics_secret`).

Variables públicas obligatorias en el entorno `production` de EAS: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_FOOTBALL_PROXY_URL` y `EXPO_PUBLIC_EAS_PROJECT_ID`. Comprobarlas con `npx eas-cli env:list --environment production` antes de cada build de release.

## Cuota de API-Football

El proxy oculta la clave pero **no aumenta el plan**: el plan Free de 100 peticiones/día se agota con pocos usuarios. **Decisión para el testing interno de Android: mantener el plan Free** y vigilar el consumo diario. Antes de abrir la app al público hará falta un plan de pago de API-Football (o una caché servidor que aún no está implementada).
