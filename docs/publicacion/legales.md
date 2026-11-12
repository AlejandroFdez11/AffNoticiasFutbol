# Textos legales y publicación

Documento de trabajo para la Fase 7. El texto que ve el usuario **no vive aquí**:
la única fuente de verdad es `AFFutbol/src/features/legal/documents.ts`. Este
archivo recoge lo que hay que decidir y rellenar antes de enviar la app a las
tiendas, y cómo se publica ese mismo texto en la web.

## Por qué existe

App Store Connect y Google Play exigen una **URL pública** de la política de
privacidad y de las condiciones de uso. El build web de la app (`npx expo export
--platform web`) sirve esas páginas en:

- `https://affutbol.app/legal/privacidad`
- `https://affutbol.app/legal/terminos`
- `https://affutbol.app/legal/fuentes`

Las mismas pantallas se pueden abrir dentro de la app desde **Perfil → Legal** y
desde la pantalla de acceso (`auth.tsx`). Al compartir una sola constante
(`LEGAL_PUBLIC_PATHS`), la versión web y la versión nativa no pueden divergir.

## Datos que hay que rellenar

| Dato | Constante en `documents.ts` | Estado |
| --- | --- | --- |
| Correo de privacidad | `LEGAL_CONTACT_EMAIL` | `privacidad@affutbol.app` (crear el buzón) |
| Correo de soporte | `LEGAL_SUPPORT_EMAIL` | `soporte@affutbol.app` (crear el buzón) |
| Dominio | `LEGAL_SITE_URL` | `https://affutbol.app` (registrar y desplegar el build web) |
| Región de hosting | — | Pendiente: Supabase (base de datos, auth y Edge Functions) y el hosting del build web |
| Encargados del tratamiento | — | Supabase (auth, base de datos, funciones) y Expo/EAS (builds y push) |
| Revisión legal | — | Pendiente: pasar el texto por un abogado antes de publicar |

Si cambia cualquiera de estos valores, hay que actualizar `LEGAL_LAST_UPDATED`
en `documents.ts`: la fecha aparece en las tres pantallas y en la versión web.

## Baja de cuenta (Apple 5.1.1(v))

Las tiendas exigen poder borrar la cuenta **desde dentro de la app**. El flujo es
**Perfil → Eliminar cuenta**:

1. La pantalla pide escribir `ELIMINAR` para desbloquear el botón.
2. `useAuth().deleteAccount()` llama a la Edge Function `delete-account`, que
   verifica el JWT y borra el usuario con la `service_role`.
3. El borrado es inmediato e irreversible: cuenta, correo, perfil, pronósticos y
   puntos, ligas privadas creadas (también para sus miembros), pertenencia a otras
   ligas, preferencias y token de notificaciones.

La palabra de confirmación está duplicada a propósito en el cliente
(`src/features/profile/delete-account.ts`) y en el servidor
(`supabase/functions/_shared/account-deletion.ts`); el test
`src/features/profile/__tests__/delete-account-test.ts` comprueba que las dos
copias coinciden.

Antes de publicar hay que desplegar la función:

```bash
npx supabase functions deploy delete-account
```

## Checklists de tienda

- [ ] Buzones `privacidad@` y `soporte@` creados y con respuesta.
- [ ] Dominio y build web desplegados; las tres URLs devuelven 200.
- [ ] Texto revisado por un abogado.
- [ ] `LEGAL_LAST_UPDATED` actualizado con la fecha de la última revisión.
- [ ] Ficha de App Store con la URL de privacidad y la de soporte.
- [ ] Ficha de Google Play con la URL de privacidad y el formulario de seguridad
      de datos.
- [ ] Función `delete-account` desplegada y probada con una cuenta real de prueba.
