# Documentos legales (ítem 9)

## Dónde está el texto

Hay **una única fuente**: `AFFutbol/src/features/legal/documents.ts`. Tres rutas de Expo Router lo renderizan:

| Documento | Ruta en la app | URL pública (una vez desplegado el sitio web) |
| --- | --- | --- |
| Política de privacidad | `/legal/privacidad` | `https://fabulous-lokum-31a2e8.netlify.app/legal/privacidad` |
| Condiciones de uso | `/legal/terminos` | `https://fabulous-lokum-31a2e8.netlify.app/legal/terminos` |
| Fuentes y atribución | `/legal/fuentes` | `https://fabulous-lokum-31a2e8.netlify.app/legal/fuentes` |

La web de Expo (`output: "server"` en `app.json`) sirve esas mismas rutas dentro del build de la app. El sitio público estático vive aparte, en `AlejandroFdez11/AffNoticiasWeb` y se despliega en Netlify; sus HTML se generan desde `documents.ts`, así que el texto de la app y el de la URL pública no pueden divergir. Los enlaces de `auth.tsx` y de Perfil apuntan a las rutas internas; las tiendas apuntan a las URL públicas.

> **Estado actual:** las URLs de este documento apuntan al sitio de Netlify `https://fabulous-lokum-31a2e8.netlify.app`. Las páginas se generan desde `documents.ts` con `npx --yes tsx scripts/generate-legal-pages.ts`, que escribe directamente en `../AffNoticiasWeb` (`legal/*/index.html` y `soporte/index.html`). Al registrar `affutbol.app` habrá que cambiar `LEGAL_SITE_URL`, regenerar las páginas, actualizar los tests de `documents-test.ts` y volver a desplegar en Netlify.

## Por qué existe

Google Play exige una **URL pública** de la política de privacidad. Al compartir una sola constante (`LEGAL_PUBLIC_PATHS`), la versión web y la versión nativa no pueden divergir. Las mismas pantallas se abren dentro de la app desde **Perfil → Legal** y desde la pantalla de acceso (`auth.tsx`).

## Datos que hay que rellenar

| Dato | Constante en `documents.ts` | Estado |
| --- | --- | --- |
| Correo de privacidad | `LEGAL_CONTACT_EMAIL` | `alejandrofdezfr9@gmail.com` (buzón real confirmado; sirve hasta crear `privacidad@affutbol.app`) |
| Correo de soporte | `LEGAL_SUPPORT_EMAIL` | `alejandrofdezfr9@gmail.com` (buzón real confirmado; sirve hasta crear `soporte@affutbol.app`) |
| Dominio | `LEGAL_SITE_URL` | `https://fabulous-lokum-31a2e8.netlify.app` (temporal; registrar `affutbol.app` más adelante) |
| Región de hosting | — | Pendiente: Supabase (base de datos, auth y Edge Functions) y el hosting del build web |
| Encargados del tratamiento | — | Supabase (auth, base de datos, funciones) y Expo/EAS (builds y push) |
| Revisión legal | — | Pendiente: pasar el texto por un abogado antes de publicar |

Si cambia cualquiera de estos valores, hay que actualizar `LEGAL_LAST_UPDATED` en `documents.ts`: la fecha aparece en las tres pantallas y en la versión web.

## Antes de enviar a revisión

- [ ] Publicar las tres rutas `/legal/*` y verificar que responden **sin iniciar sesión** y con HTTPS válido.
- [x] Usar `alejandrofdezfr9@gmail.com` como correo temporal de privacidad y soporte (confirmado por el titular). Si cambia, editar `LEGAL_CONTACT_EMAIL` y `LEGAL_SUPPORT_EMAIL` en `documents.ts`, regenerar las páginas y actualizar la ficha de tienda.
- [ ] Confirmar la región real de alojamiento del proyecto de Supabase y añadirla al apartado 4 de la política de privacidad (ahora dice «la región configurada en Supabase»).
- [x] Sin Supabase Pro: la política ya no afirma que existan copias automáticas; el apartado 5 indica que el plan actual no las incluye. Si se contrata Pro/PITR en el futuro, actualizar el apartado 5 y volver a subir `LEGAL_LAST_UPDATED`.
- [ ] Revisar los textos con un profesional jurídico. Son documentos de una app española (RGPD + LOPDGDD), no asesoramiento legal.
- [ ] Rellenar Google Play Console → **Data safety** con `docs/publicacion/app-privacy.md`.
- [ ] Marcar la casilla de «cumplimiento de la regla 5.1.1(v)»: la app incluye borrado de cuenta en Perfil → Eliminar cuenta y el correo alternativo está en la política.
- [ ] Si se añade analítica, publicidad, compras o inicios de sesión nuevos, actualizar los documentos y la declaración de privacidad **antes** de publicar la versión.
- [x] `LEGAL_LAST_UPDATED` actualizado a revisión 6 (23 de noviembre de 2026); volver a subirlo si la revisión jurídica cambia el texto.
- [ ] Función `delete-account` desplegada y probada con una cuenta real de prueba.

## Baja de cuenta (requisito de la tienda)

Las tiendas exigen poder borrar la cuenta **desde dentro de la app**. El flujo es **Perfil → Eliminar cuenta**:

1. La pantalla pide escribir `ELIMINAR` para desbloquear el botón.
2. `useAuth().deleteAccount()` llama a la Edge Function `delete-account`, que verifica el JWT y borra el usuario con la `service_role`.
3. El borrado es inmediato e irreversible: cuenta, correo, perfil, pronósticos y puntos, ligas privadas creadas (también para sus miembros), pertenencia a otras ligas, preferencias y token de notificaciones.

La palabra de confirmación está duplicada a propósito en el cliente (`src/features/profile/delete-account.ts`) y en el servidor (`supabase/functions/_shared/account-deletion.ts`); el test `src/features/profile/__tests__/delete-account-test.ts` comprueba que las dos copias coinciden.

Antes de publicar hay que desplegar la función:

```bash
npx supabase functions deploy delete-account
```

## Cambios futuros

Al modificar cualquier copia hay que subir `LEGAL_LAST_UPDATED` en `documents.ts`. Los tests `src/features/legal/__tests__/documents-test.ts` comprueban que los documentos siguen teniendo contenido, que las URL públicas son estables y que la política cubre borrado, retención y derechos.
