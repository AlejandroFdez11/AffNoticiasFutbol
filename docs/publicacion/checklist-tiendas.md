# Checklist de publicación (ítems 8–13)

Estado del código en el repo y lo que queda como acción manual en consolas. La continuación (ítems 14–18) está en [`verificacion-y-pulido.md`](verificacion-y-pulido.md).

| Ítem | Estado en el repo | Pendiente fuera del repo |
| --- | --- | --- |
| 8. Eliminar cuenta | ✅ Hecho: UI en Perfil → Eliminar cuenta (confirmación escribiendo `ELIMINAR`), Edge Function `delete-account` desplegada y activa, RLS/cascada ya existente, tests | Comprobar el borrado con la cuenta demo en el APK interno (sin tienda) |
| 9. Privacidad y términos con URL pública | ✅ Hecho: textos en `src/features/legal/documents.ts`, rutas `/legal/*` (app + web de `AffNoticiasWeb` en Netlify), enlaces en `auth.tsx` y Perfil, revisión 6 publicada | Buzones reales y revisión jurídica; no hay Data Safety porque Play queda en espera |
| 10. Iconos y splash definitivos | ✅ Hecho: arte propio «escudo + balón» integrado; másteres en `assets/brand/` y PNG exportados | Verificar icono adaptativo/temático y splash en el APK interno; ver `iconos-y-splash.md` |
| 11. Ficha de tienda y cuenta demo | ✅ Cuenta demo creada y verificada; descripción, metadatos, guion de capturas, página de soporte y página de descarga publicados | Capturas de QA en el APK interno. Play Console y su ficha quedan en espera |
| 12. Licencia y atribución | ✅ Hecho: `LICENSE` propietaria, pantalla `/legal/fuentes`, documento de revisión de RSS y marcas | Revisar los términos de Marca / Mundo Deportivo / Relevo / 20minutos / La Vanguardia / ESPN y el uso de imágenes en caliente; validación jurídica |
| 13. Plan de Supabase | ✅ Decidido: mantener el plan Free; API-Football Free para testing interno | Sin Pro, backups ni PITR; SMTP propio y vigilancia de inactividad/cuota; subir de plan de API-Football antes de abrir al público |

**Decisión de distribución (23/11/2026):** no se pagará el registro de Google Play Console. El envío a tienda y el *Data Safety* quedan en espera; la QA se hace con el **APK de distribución interna de EAS** (perfil `internal` en `eas.json`).

## Orden recomendado

1. **Desplegar el borrado de cuenta** y probarlo de punta a punta:
   ```bash
   cd AFFutbol
   npx supabase db push
   npx supabase functions deploy delete-account
   ```
   No hace falta una migración nueva: todas las tablas con datos de usuario ya tienen `on delete cascade` hacia `auth.users`.
2. **Publicar el sitio web** con las tres rutas legales y verificar las URL sin sesión.
3. **No cambiar el plan de Supabase:** se mantiene Free; configurar SMTP propio y vigilar la pausa por inactividad (no hay copias automáticas ni PITR).
4. **Sustituir iconos y splash**, limpiar caché (`npx expo start -c`) y generar builds.
5. **Cuenta demo ya creada** (`demo@affutbol.app`); hacer las capturas de QA en Android con el APK interno. Las capturas de App Store (iPhone/iPad) solo serían obligatorias si se decidiera publicar en iOS.
6. **No hay envío a tienda:** la ficha (`ficha-app-store.md`) y la declaración (`app-privacy.md`) se conservan para el futuro; no se paga ni se registra Google Play.

## Comprobaciones técnicas antes de distribuir

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

Además, en el **APK interno de producción** (no en Expo Go):

- Login con la cuenta demo, pronóstico, liga privada y notificaciones activadas.
- `Perfil → Eliminar cuenta` con la palabra `ELIMINAR`: la app vuelve al estado sin sesión y Supabase queda sin filas del usuario.
- Los enlaces legales se abren desde el registro y desde Perfil, y las mismas direcciones responden en el navegador.
- Push en Android con FCM configurado en EAS (Expo Go no sirve para probarlo). iOS no se distribuye en esta fase.
