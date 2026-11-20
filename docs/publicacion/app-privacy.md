# Declaración de privacidad para tiendas (ítems 9 y 11)

Esta tabla describe **lo que la app hace hoy**. Cópiala a los cuestionarios de App Store Connect → *App Privacy* y Google Play Console → *Data safety*. Si se añade analítica, publicidad o compras, hay que revisarla.

| Dato | Categoría Apple / Google | Recogido | Vinculado al usuario | Uso para rastreo | Finalidad | Conservación |
| --- | --- | --- | --- | --- | --- | --- |
| Correo electrónico | Contact Info → Email Address | Sí (registro) | Sí | No | Identificar la cuenta, recuperar acceso | Hasta borrar la cuenta |
| Nombre visible y nombre de usuario | Contact Info → Name | Sí (opcional) | Sí | No | Mostrar el perfil y los rankings | Hasta borrar la cuenta |
| Equipo favorito, foto de perfil de OAuth | User Content → Other User Content | Sí (opcional) | Sí | No | Personalizar partidos, pronósticos y avisos | Hasta borrar la cuenta |
| Nombre, avatar, color y equipo favorito de cada perfil de la app (máx. 3 por cuenta) | User Content → Other User Content | Sí | Sí | No | Elegir quién está viendo la app; cada perfil tiene su propio equipo y el perfil activo se guarda solo en el dispositivo | Hasta borrar el perfil o la cuenta |
| Pronósticos, puntos e historial | User Content → Other User Content | Sí | Sí | No | Mecánica del juego y rankings | Hasta borrar la cuenta |
| Nombre de liga, rol y pertenencia | User Content → Other User Content | Sí (si usas ligas) | Sí | No | Ligas privadas | Hasta borrar la cuenta (las ligas propias desaparecen) |
| ID interno de Supabase | Identifiers → User ID | Sí | Sí | No | Asociar tus datos y aplicar permisos (RLS) | Hasta borrar la cuenta |
| Token de notificaciones de Expo | Identifiers → Device ID | Sí (si activas push) | Sí | No | Enviar avisos a este dispositivo | Hasta desactivarlos, cerrar sesión o borrar la cuenta |
| Preferencias de aviso y registro de envíos | User Content → Other User Content | Sí (si activas push) | Sí | No | Respetar tus preferencias y no repetir avisos | Hasta borrar la cuenta |
| Dirección IP y logs de acceso | Identifiers → IP Address (Google) / Usage Data → Other Usage Data (Apple) | Sí, por la infraestructura (HTTPS) | No deliberadamente | No | Entregar el servicio y protegerlo de abusos | Según la política del proveedor; no se guardan en la base de datos de la app |

## Respuestas que hay que marcar

**App Store Connect (App Privacy)**

- Tipos de datos recogidos: *Contact Info* (Email Address, Name), *Identifiers* (User ID, Device ID), *User Content* (Other User Content) y *Usage Data* (Other Usage Data) según la tabla.
- ¿Datos vinculados al usuario? **Sí** para todos los anteriores excepto los logs de infraestructura.
- ¿Datos usados para seguimiento (tracking)? **No**. Por tanto no hace falta el prompting de ATT.
- ¿Datos compartidos con terceros? **No** en el sentido de la tienda (no se venden ni se usan para fines propios de terceros). Supabase y Expo son proveedores que tratan los datos por nuestra cuenta, bajo contrato.
- Finalidades: *App Functionality* para todo. No marcar *Analytics*, *Advertising*, *Personalization* ni *Product Improvement*.
- App elimina datos: **Sí** (tienda: Perfil → Eliminar cuenta; por correo: `alejandrofdezfr9@gmail.com`).

**Google Play (Data safety)**

- ¿Recoges datos? **Sí**, los de la tabla. ¿Compartes datos con terceros? **No**.
- ¿Datos cifrados en tránsito? **Sí** (HTTPS en todas las llamadas).
- ¿Los usuarios pueden pedir su eliminación? **Sí**, desde la app y por correo.
- ¿Se recogen datos de menores? **No**: la app no está dirigida a menores de 14 años (consentimiento exigido en España).

## Verificación rápida antes de enviar

1. Abrir Perfil en un build de producción y comprobar que aparecen **Eliminar cuenta** y **Legal**.
2. Completar el borrado con la cuenta de demostración y verificar en Supabase que desaparecen `auth.users`, `profiles`, `account_profiles`, `predictions`, `leagues`, `league_members`, `push_tokens`, `notification_preferences`, `push_deliveries` y `ranking_state`.
3. Comprobar que la política pública indicada en la ficha coincide con el texto de la app (ambos salen de `documents.ts`).
