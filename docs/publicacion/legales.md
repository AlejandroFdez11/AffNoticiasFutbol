# Documentos legales (ítem 9)

## Dónde está el texto

Hay **una única fuente**: `AFFutbol/src/features/legal/documents.ts`. Tres rutas de Expo Router lo renderizan:

| Documento | Ruta en la app | URL pública (una vez desplegado el sitio web) |
| --- | --- | --- |
| Política de privacidad | `/legal/privacidad` | `https://affutbol.app/legal/privacidad` |
| Condiciones de uso | `/legal/terminos` | `https://affutbol.app/legal/terminos` |
| Fuentes y atribución | `/legal/fuentes` | `https://affutbol.app/legal/fuentes` |

La web de Expo (`output: "server"` en `app.json`) sirve esas mismas rutas, así que el texto de la app y el de la URL pública no pueden divergir. Los enlaces de `auth.tsx` y de Perfil apuntan a las rutas internas; App Store Connect y Google Play apuntan a las URL públicas.

## Antes de enviar a revisión

- [ ] Comprar/configurar el dominio `affutbol.app` y desplegar la build web (`npx expo export --platform web` + adaptador de servidor). Verificar que las tres URL responden **sin iniciar sesión** y con HTTPS válido.
- [ ] Crear los buzones `privacidad@affutbol.app` y `soporte@affutbol.app`. Los textos legales y la ficha de tienda usan esas direcciones; si cambian, editar `LEGAL_CONTACT_EMAIL` y `LEGAL_SUPPORT_EMAIL` en `documents.ts` y la URL de soporte en App Store Connect.
- [ ] Confirmar la región real de alojamiento del proyecto de Supabase y añadirla al apartado 4 de la política de privacidad (ahora dice «la región configurada en Supabase»).
- [ ] Confirmar la retención real de las copias de seguridad: la política dice «rotación máxima de 7 días», que es lo que incluye Supabase Pro por defecto. Si se contrata PITR o se cambia la retención, actualizar el apartado 5.
- [ ] Revisar los textos con un profesional jurídico. Son documentos de una app española (RGPD + LOPDGDD), no asesoramiento legal.
- [ ] Rellenar App Store Connect → **App Privacy** y Google Play Console → **Data safety** con `docs/publicacion/app-privacy.md`.
- [ ] Marcar las casillas de «cumplimiento de la regla 5.1.1(v)»: la app incluye borrado de cuenta en Perfil → Eliminar cuenta y el correo alternativo está en la política.
- [ ] Si se añade analítica, publicidad, compras o inicios de sesión nuevos, actualizar los documentos y la declaración de privacidad **antes** de publicar la versión.

## Cambios futuros

Al modificar cualquier copia hay que subir `LEGAL_LAST_UPDATED` en `documents.ts`. Los tests `src/features/legal/__tests__/documents-test.ts` comprueban que los documentos siguen teniendo contenido, que las URL públicas son estables y que la política cubre borrado, retención y derechos.
