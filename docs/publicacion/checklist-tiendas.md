# Checklist de publicación (ítems 8–13)

Estado del código en el repo y lo que queda como acción manual en consolas. La continuación (ítems 14–18) está en [`verificacion-y-pulido.md`](verificacion-y-pulido.md).

| Ítem | Estado en el repo | Pendiente fuera del repo |
| --- | --- | --- |
| 8. Eliminar cuenta | ✅ Hecho: UI en Perfil → Eliminar cuenta (confirmación escribiendo `ELIMINAR`), Edge Function `delete-account` con service role, RLS/cascada ya existente, tests | Desplegar la función; comprobar el borrado con la cuenta demo; adjuntar la captura del flujo si la tienda la pide |
| 9. Privacidad y términos con URL pública | ✅ Hecho: textos en `src/features/legal/documents.ts`, rutas `/legal/*` (app + web), enlaces en `auth.tsx` y Perfil, declaración de privacidad documentada | Publicar las URLs (primero GitHub Pages), buzones reales, revisión jurídica, rellenar Data Safety de Google Play |
| 10. Iconos y splash definitivos | ✅ Hecho: arte propio «escudo + balón» integrado; másteres en `assets/brand/` y PNG exportados | Verificar icono adaptativo/temático y splash en una build real de Android; ver `iconos-y-splash.md` |
| 11. Ficha de tienda y cuenta demo | ✅ Borrador listo: descripción, metadatos, guion de capturas, notas y plantilla de credenciales | Crear la cuenta demo, hacer las capturas de Android, crear la página de soporte, rellenar los campos |
| 12. Licencia y atribución | ✅ Hecho: `LICENSE` propietaria, pantalla `/legal/fuentes`, documento de revisión de RSS y marcas | Revisar los términos de Marca / Mundo Deportivo / Relevo y el uso de imágenes en caliente; validación jurídica |
| 13. Plan de Supabase | 📝 Requisitos documentados | Pasar a Pro, SMTP propio, backups + PITR, spend cap, región, plan de API-Football |

## Orden recomendado

1. **Desplegar el borrado de cuenta** y probarlo de punta a punta:
   ```bash
   cd AFFutbol
   npx supabase db push
   npx supabase functions deploy delete-account
   ```
   No hace falta una migración nueva: todas las tablas con datos de usuario ya tienen `on delete cascade` hacia `auth.users`.
2. **Publicar el sitio web** con las tres rutas legales y verificar las URL sin sesión.
3. **Pasar Supabase a Pro** y configurar SMTP/backups; es lo que evita la pausa por inactividad y permite recuperación.
4. **Sustituir iconos y splash**, limpiar caché (`npx expo start -c`) y generar builds.
5. **Crear cuenta demo y capturas** (iPhone 6,9" + iPad 13" son obligatorias).
6. **Rellenar la ficha** con `ficha-app-store.md` y `app-privacy.md`, pegar las notas de revisión y enviar.

## Comprobaciones técnicas antes del envío

```bash
cd AFFutbol
npm install
npm run lint
npm run typecheck
npm test -- --ci
npx expo-doctor
npx expo export --platform ios
npx expo export --platform web
```

Además, en un **build de producción** (no en Expo Go):

- Login con la cuenta demo, pronóstico, liga privada y notificaciones activadas.
- `Perfil → Eliminar cuenta` con la palabra `ELIMINAR`: la app vuelve al estado sin sesión y Supabase queda sin filas del usuario.
- Los enlaces legales se abren desde el registro y desde Perfil, y las mismas direcciones responden en el navegador.
- Push en iOS y Android con FCM/APNs configurados (Expo Go no sirve para probarlo).
