# Verificación y pulido (ítems 14–18)

Continuación de [`checklist-tiendas.md`](checklist-tiendas.md). Estado del repo y acciones que todavía requieren consolas, dispositivos o una decisión de producto.

| Ítem | Estado en el repo | Pendiente fuera del repo |
| --- | --- | --- |
| 14. Verificación técnica y repaso en dispositivos | ✅ Comprobaciones locales ejecutadas el 17/11/2026 | Recorrido manual de todos los flujos en la build de Android, con modo claro/oscuro y sin red |
| 15. Rate limits y CAPTCHA de Supabase Auth | ✅ Decidido: **solo rate limits**, sin CAPTCHA por ahora | Configurar límites por IP en Supabase y dejar CAPTCHA desactivado; si se activa en el futuro, implementar antes el widget en el cliente |
| 16. Monitorización de errores | 📝 Decidido: **no implementar ahora**; queda documentado (no hay Sentry ni equivalente) | Si se añade más adelante: crear proyecto, SDK y DSN, subir source maps y actualizar la política de privacidad si se recogen datos de diagnóstico |
| 17. Hosting de la web | ✅ URLs legales publicadas en GitHub Pages desde `develop:/docs`, generadas desde `documents.ts` | Sustituir por el dominio definitivo cuando se registre `affutbol.app` |
| 18. Instantáneas con `shortName` | ✅ Hecho: función redesplegada, `dryRun` y sync real correctos, `shortName` presente en las cuatro ligas | Nada; el cron `statistics-sync` ya mantendrá el campo en las siguientes ejecuciones |

## 14. Verificación técnica y pruebas en dispositivo

Comprobaciones ejecutadas desde `AFFutbol/` con Expo SDK 58:

```bash
npx expo-doctor                 # 20/20 checks passed
npx expo export --platform android
npx expo export --platform web
npm run lint
npm run typecheck
npm test -- --ci                # 35 suites, 295 tests
```

El primer `expo-doctor` detectó 18 paquetes desalineados con el SDK (incluido `react-native-safe-area-context` en una versión menor distinta). Se corrigieron con `npx expo install --fix`, que también añadió el plugin `expo-status-bar` en `app.json`. Tras el ajuste, doctor (20/20), lint, typecheck, tests y los exports de Android y web pasan. El bundle es un smoke test: **no sustituye** probar la app en un móvil.

Build de producción de Android terminada el 23/11/2026: ID `438dfa99-2bb0-4bce-9e2f-e84359d09a75`, perfil `production`, `versionCode` 3 (autoincrement desde 2), canal `production`, lanzada desde `develop` con las correcciones de noticias y legales rev 6. AAB: https://expo.dev/artifacts/eas/rzGKL1z8uwhMMyzdaxz49cjaro_hH1gTQ6zwg1Vvi1s.aab. Logs: https://expo.dev/accounts/aff_11/projects/affutbol/builds/438dfa99-2bb0-4bce-9e2f-e84359d09a75. Build anterior: `4d38ec09-1e83-4c45-8409-5b216c41fbba` (`versionCode` 2, commit `ebe3721`). No se enviará a Google Play: el titular decidió no pagar el registro de Play Console. La QA se hace con el APK de distribución interna de EAS (perfil `internal`).

Repaso pendiente en el APK interno de EAS (Expo Go sirve para todo salvo push):

- [ ] Registro con email: confirmación por correo, login, reset de contraseña y cierre de sesión.
- [ ] Registro con Google: proveedor configurado en Supabase, cuenta de prueba incluida, retorno a `/auth-callback`.
- [ ] Pronóstico: elegir partido del equipo favorito, guardarlo antes del kickoff y ver el resumen tras la liquidación.
- [ ] Ligas privadas: crear liga, copiar/pegar código de 6 caracteres, unirse, ver la tabla y salir de una liga (el owner la borra).
- [ ] Push: activar preferencias en Perfil, recibir recordatorio/resultado/cambio de ranking en Android con FCM configurado; desactivar cada tipo y comprobar que no llegan.
- [ ] Modo oscuro: recorrer Partidos, Noticias, Estadísticas, Predicciones, Ranking y Perfil con el tema del sistema en claro y en oscuro (incluidas hojas modales y pantallas legales).
- [ ] Errores y offline: activar modo avión en cada pestaña, provocar una respuesta fallida del proxy y comprobar mensaje de error, botón de reintento, estados vacíos y que no se pierde un pronóstico ya enviado.
- [ ] Borrado de cuenta: escribir `ELIMINAR`, volver al estado sin sesión y verificar que Supabase queda sin filas del usuario.

## 15. Rate limits y CAPTCHA de Supabase Auth

Antes de abrir el registro al público, en Supabase → Authentication:

1. **Rate limits:** bajar los límites por IP de signup, login, recuperación de contraseña y verificación de email, y mantener la confirmación de email activa con SMTP propio (el SMTP de prueba tiene cuotas muy bajas).
2. **CAPTCHA:** Supabase admite Cloudflare Turnstile (gratis) y hCaptcha en *Bot and Abuse Protection*.

**Decisión tomada: opción A, solo rate limits.** No activar CAPTCHA mientras el volumen sea bajo; apoyarse en límites por IP, confirmación de email y SMTP propio.

⚠️ **Importante si se reconsidera más adelante:** nuestra UI es propia, no la de Supabase. Según la documentación de Supabase, al activar CAPTCHA el cliente debe obtener un token del widget y enviarlo como `options.captchaToken` en `supabase.auth.signUp`, `signInWithPassword` y `resetPasswordForEmail`. Hoy `src/features/auth/auth-context.tsx` no envía ese campo, así que **activar CAPTCHA solo en el dashboard rompería registro, login y reset**. La alternativa sería añadir el widget de Turnstile en `auth.tsx` (site key pública vía `EXPO_PUBLIC_*`), pasar el token en las tres llamadas y guardar el secret solo en Supabase; en nativo hace falta un WebView, disponible solo en development build. Probar primero con las claves de test de Cloudflare. No dejar CAPTCHA activado sin el cambio de cliente.

## 16. Monitorización de errores

No hay Sentry ni ningún sistema de reporte de errores. **Decisión tomada: no implementar ahora**; se revisará si aparecen usuarios reales o incidencias que no se puedan reproducir. Recomendación para ese momento:

- Añadir `@sentry/react-native` con el plugin/config para Expo, DSN inyectado como variable de EAS (nunca `EXPO_PUBLIC_*` si no debe ser público; en Sentry el DSN es público, pero conviene mantenerlo fuera del repo).
- Subir source maps en cada build para ver stack traces legibles.
- Revisar la política de privacidad antes de recoger IDs de dispositivo o datos de diagnóstico: si se añade esta recogida, actualizar `src/features/legal/documents.ts` (y `LEGAL_LAST_UPDATED`), `docs/publicacion/app-privacy.md` y las declaraciones de App Store / Google Play.

Requiere cuenta externa y DSN; no se ha tocado código.

## 17. Hosting de la web

`AFFutbol/app.json` declara `"web": { "output": "server" }`, así que `npx expo export --platform web` genera una build que necesita un entorno Node con el adaptador de servidor correspondiente: no se puede dejar como archivos estáticos en cualquier CDN.

No se va a publicar la app web completa, pero **sí las URL legales**, que Google Play exige públicamente accesibles. La solución elegida es servir solo esas páginas como HTML estático en GitHub Pages, desde `develop:/docs`, con HTTPS válido:

- `https://alejandrofdez11.github.io/AffNoticiasFutbol/legal/privacidad`
- `https://alejandrofdez11.github.io/AffNoticiasFutbol/legal/terminos`
- `https://alejandrofdez11.github.io/AffNoticiasFutbol/legal/fuentes`
- `https://alejandrofdez11.github.io/AffNoticiasFutbol/soporte`

El texto se genera desde `src/features/legal/documents.ts` con `npx --yes tsx scripts/generate-legal-pages.ts`, así que no puede divergir del que muestra la app. Al registrar `affutbol.app` habrá que cambiar `LEGAL_SITE_URL`, regenerar las páginas y actualizar los tests.

## 18. Instantáneas con `shortName`

Hecho el 17/11/2026:

1. `npx supabase functions deploy sync-statistics --no-verify-jwt` (el warning sobre `_shared/other.ts` venía de un comentario con una importación de ejemplo; se reescribió el comentario y el redespliegue salió limpio).
2. `dryRun` con las cuatro ligas:season 2026/27, clasificaciones y goleadores reales, sin escrituras.
3. Sync real: las cuatro ligas devolvieron `ok=true`.
4. Verificación en `public.statistics_snapshots`: `shortName` presente en las 4 filas de `league` y en las 78 filas de `standings` (20 + 20 + 20 + 18).

El secreto compartido no está en el repo: se leyó de `vault.decrypted_secrets` (`statistics_secret`) solo para la llamada. Para repetir la comprobación:

```bash
npx supabase secrets set STATISTICS_SYNC_SECRET=<secreto>   # si hace falta
npx supabase functions deploy sync-statistics --no-verify-jwt
curl -X POST https://<project-ref>.supabase.co/functions/v1/sync-statistics \
  -H "x-statistics-secret: <secreto>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

En PowerShell, el cuerpo entre comillas simples (`-d '{"dryRun":true}'`) o `Invoke-RestMethod` con un objeto; con comillas dobles escapadas llega roto y la función responde `400 Invalid JSON body`.
