# ⚽ AFFutbol

**AFFutbol** es una aplicación móvil para seguir el fútbol al día y competir con tus amigos y compañeros de trabajo haciendo predicciones de los partidos de tu equipo.

## ✨ Características

- **Partidos del día:** los encuentros de las competiciones seleccionadas, agrupados por competición, con marcador en directo y detalle de cada partido (eventos, alineaciones dibujadas sobre el campo y estadísticas).
- **Noticias y rumores:** actualidad, análisis y mercado en un mismo feed, con filtros y detalle de cada contenido.
- **Estadísticas:** clasificación real (puntos, diferencia de goles, forma y escudos) y tabla de goleadores de las cuatro grandes ligas, con acceso desde Partidos y Noticias.
- **Predicciones:** pronostica el marcador de los partidos de tu equipo favorito antes del inicio y suma puntos cuando termina el partido (10 por marcador exacto, 5 por acertar los goles de un equipo).
- **Rankings:**
  - 🌍 **Ranking mundial** entre todos los usuarios con pronósticos, con tu posición destacada.
  - 👥 **Ligas privadas** para competir con colegas o compañeros del curro: crea una liga, comparte su código de invitación de 6 caracteres y consulta la tabla de miembros.
- **Notificaciones push:** recordatorio una hora antes de los partidos de tu equipo favorito, resultado de tus pronósticos cuando se liquidan y aviso cuando cambia tu posición en el ranking mundial o en una liga privada. Se pueden desactivar por tipo desde Perfil.

## 📊 Estado del proyecto

| Fase | Estado |
| --- | --- |
| Fase 0 — Cimientos y navegación | ✅ Completada |
| Fase 1 — Partidos del día y detalle | ✅ Completada |
| Fase 2 — Noticias, estadísticas y rumores | ✅ Completada |
| Fase 3 — Autenticación y perfil | ✅ Completada |
| Fase 4 — Predicciones | ✅ Completada |
| Fase 5 — Rankings y ligas privadas | ✅ Completada |
| Fase 6 — Notificaciones push | ✅ Completada |
| Fase 7 — Pulido y publicación | ⏳ Pendiente |

## 🛠️ Stack tecnológico

- **Framework:** [Expo SDK 58](https://docs.expo.dev/) + React Native 0.88
- **Lenguaje:** TypeScript (modo estricto)
- **UI:** React Native + Expo Router (native tabs)
- **Estado del servidor:** TanStack Query
- **Fechas:** date-fns (locale español)
- **Backend / auth / push / estadísticas:** [Supabase](https://supabase.com/) (Fases 3–7)
- **Datos de fútbol:** [API-Football](https://www.api-football.com/) (api-sports), [football-data.org](https://www.football-data.org/) y Wikipedia (estadísticas)

## 🚀 Instalación

Requisitos: **Node.js 20+**, npm y la app **Expo Go** en tu móvil (o un development build).

```bash
git clone https://github.com/tu-usuario/AFFutbol.git
cd AffNoticiasFutbol/AFFutbol
npm install
```

Crea tu archivo de entorno a partir del ejemplo:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Arranca el servidor de desarrollo:

```bash
npx expo start
```

Escanea el QR con Expo Go o pulsa `i` / `a` para abrir un simulador.

> La app funciona sin API key usando datos simulados (`EXPO_PUBLIC_USE_MOCKS=true`).

## 🔑 Variables de entorno

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `EXPO_PUBLIC_API_FOOTBALL_PROXY_URL` | Edge Function `api-football` de Supabase; es el transporte de producción y la clave vive en el servidor | vacío |
| `EXPO_PUBLIC_API_FOOTBALL_KEY` | API key de API-Football; **solo desarrollo local** sin proxy | vacío |
| `EXPO_PUBLIC_API_FOOTBALL_BASE_URL` | URL base de la API | `https://v3.football.api-sports.io` |
| `EXPO_PUBLIC_USE_MOCKS` | Fuerza el uso de datos simulados (`true`/`false`) | `true` si no hay proxy ni key |
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase | vacío |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key de Supabase (pública) | vacío |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Project id de EAS para el push token; `eas init` lo escribe en `app.json` | vacío |
| `EXPO_TOKEN` | Solo para la CLI de EAS (`npx eas-cli build`); no se incluye en el bundle | vacío |

> ⚠️ Las variables `EXPO_PUBLIC_*` se incluyen en el bundle. No guardes secretos privados ahí. En producción la app no lleva clave de API-Football: llama a la Edge Function `api-football`, que la guarda en el servidor.

### Datos y límites de la API

- Las peticiones salen de la Edge Function `api-football`, que guarda la clave en el servidor; el móvil no la lleva. Sin proxy ni clave, la app usa datos simulados.
- La app solo usa los endpoints `fixtures?date=` y `fixtures?id=` (más `events`, `lineups` y `statistics` por partido). El plan Free de API-Football **no permite consultar ligas por temporada** fuera de 2022–2024.
- El listado de partidos se filtra en el dispositivo con una lista blanca de competiciones (`src/features/matches/league-filter.ts`): 5 grandes ligas y sus segundas divisiones, copas nacionales, copas europeas, Brasil, Argentina, Libertadores y selecciones. Este filtro no gasta peticiones adicionales.
- El plan Free incluye **100 peticiones al día**, así que el listado se cachea 5 minutos y el refresco es manual (tirar de la lista o el botón de actualizar). No hay polling automático.
- Un día completo de partidos se obtiene con **una sola petición**; el detalle consume como máximo 4 (una por pestaña visitada).
- **Noticias y rumores:** se leen de la tabla `news_items` de Supabase, que rellena la Edge Function `news-refresh` a partir de feeds RSS de medios españoles. La app solo muestra titular, extracto y enlace al medio original; nunca reproduce el artículo completo. Sin Supabase configurado se usa el contenido de muestra local.
- **Predicciones y rankings:** las predicciones, sus puntos y las ligas privadas viven en Supabase. Los puntos los calcula el servidor al terminar el partido (la Edge Function `settle-predictions`); el cliente nunca puede escribirlos. Los rankings son agregados calculados en SQL y no gastan cuota de API-Football.
- **Notificaciones:** los recordatorios leen la caché de partidos de Supabase (2 peticiones a API-Football al día), los resultados salen de las predicciones ya liquidadas y los avisos de ranking de agregados SQL. Enviar notificaciones no gasta cuota adicional.
- **Estadísticas:** reales y gratis para siempre. La clasificación (puntos, diferencia de goles, forma y escudos) sale de football-data.org y los goleadores de la Wikipedia inglesa; ambas fuentes son gratuitas y sin límite diario. Las descarga la Edge Function `sync-statistics` dos veces al día y la app solo lee la tabla `statistics_snapshots` de Supabase, así que el móvil no gasta peticiones. Si Supabase no está configurado o la tabla aún no existe, la app muestra el contenido de muestra local (`src/features/statistics/data.ts`) etiquetado como «Datos de muestra». La fuente gratuita solo publica **goles**, no asistencias ni partidos jugados: cuando faltan, la columna de asistencias se oculta en vez de rellenarse con ceros.
- Si `EXPO_PUBLIC_USE_MOCKS=true` la app usa datos simulados deterministas (partidos finalizados, en directo y programados) sin gastar cuota.

### Fuentes de noticias

| Fuente | Feed | Uso |
| --- | --- | --- |
| Marca | `portada.xml`, `primera-division.xml`, `futbol-internacional.xml` | Noticias |
| Marca | `mercado-fichajes.xml` | Rumores de fichajes |
| Mundo Deportivo | `rss/futbol` | Noticias |
| Relevo | `rss` | Noticias |

- Los feeds viven en la tabla `news_sources`, no en el código: desactivar uno que se rompa es un `UPDATE`, sin desplegar nada.
- `supabase/functions/news-refresh` descarga y normaliza los feeds, deduplica entre medios y hace upsert en `news_items`. Se despliega con `npx supabase functions deploy news-refresh` y aplica un throttle de 10 minutos por fuente (los medios no son nuestra CDN).
- La normalización está en `supabase/functions/_shared/normalize.ts`: funciones puras, sin APIs de Deno, cubiertas por Jest. Los rumores salen de heurísticas sobre el titular (club, jugador, importe y estado); cuando algo no se puede deducir, el campo queda vacío en vez de inventarse.
- Solo se guardan titular, extracto e imagen con enlace al medio original. El cuerpo del artículo no se reproduce.
- Retención de 14 días en `news_items`. La app lee como máximo 60 piezas.

## 📈 Estadísticas reales (Fase 2)

La pestaña de estadísticas muestra la clasificación y los goleadores reales de LaLiga, Premier League, Serie A y Bundesliga. Todo se apoya en fuentes **gratuitas sin límite diario**, y el móvil solo lee Supabase.

| Dato | Fuente | Coste |
| --- | --- | --- |
| Clasificación (puntos, goles, forma y escudos) | football-data.org `/v4/competitions/{PD,PL,SA,BL1}/standings` | Gratis: 12 competiciones, 10 peticiones/minuto, sin tope diario |
| Goleadores (solo goles) | Tabla «Top goalscorers» de la Wikipedia inglesa | Gratis (4 peticiones por sincronización) |

- **Tabla:** `statistics_snapshots` guarda una fila por liga con `payload` (jsonb) que contiene la instantánea completa (liga, clasificación y goleadores). RLS activa y solo `select` para clientes: la escribe el service role de la Edge Function, nunca la app.
- **Sincronización:** `supabase/functions/sync-statistics` acepta `{ "leagues": ["laliga"], "dryRun": true }`. En una ejecución normal descarga las cuatro ligas en serie (4 peticiones a football-data.org + 4 a Wikipedia), resuelve los escudos de los goleadores a partir de la clasificación y hace upsert en la tabla. Con `dryRun` no escribe nada y devuelve una vista previa: es la forma de comprobar el parser contra los artículos reales. Un cuerpo vacío sincroniza las cuatro ligas, pero un JSON roto o una lista de `leagues` sin ningún id conocido responde `400` para que una errata no acabe en una escritura real.
- **Sin romperse si falla una fuente:** cada lado falla por separado. Si Wikipedia cambia el formato de la tabla, se conservan los goleadores anteriores; si football-data.org devuelve un error o una tabla vacía, se conserva la clasificación anterior. La app nunca se queda en blanco por un fallo puntual.
- **Cron:** el job `statistics-sync` (migración `20261110000100_statistics_cron.sql`) llama a la función a las 03:30 y a las 15:30 UTC, después de las jornadas. Usa el secreto compartido `statistics_secret` guardado en Vault.
- **Goleadores sin asistencias:** la fuente gratuita solo publica goles. `ScorerRow.assists` y `matches` son opcionales; si no llegan, la columna de asistencias no se pinta. Los datos de muestra sí las tienen.
- **Nombres compactos:** cada equipo guarda `name` (nombre oficial completo, que es la clave para casar los escudos con la tabla de goleadores) y `shortName` («Barça», «Atleti»), que es lo que se pinta en la clasificación para que quepa en el móvil. Las instantáneas antiguas sin `shortName` siguen funcionando: se muestra el nombre completo.
- **Parser cubierto por tests:** `supabase/functions/_shared/wikipedia-scorers.ts` entiende las variantes reales del wikitexto (`Top goalscorers` / `Top scorers`, `rowspan` en goles y en club, plantillas de bandera y enlaces con pipe). Los fixtures de `src/features/statistics/__tests__/wikipedia-scorers-test.ts` son wikitexto real de la temporada 2026–27.

**Puesta en marcha**

1. Crea un token gratuito en [football-data.org](https://www.football-data.org/client/register).
2. `npx supabase secrets set FOOTBALL_DATA_TOKEN=<token> STATISTICS_SYNC_SECRET=<secreto> WIKI_USER_AGENT="AFFutbol/1.0 (statistics sync; +https://affutbol.app)"`.
3. `npx supabase db push` (tabla y cron) y guarda el mismo secreto en Vault:
   `select vault.create_secret('<secreto>', 'statistics_secret', 'Secreto compartido de sync-statistics');`
4. `npx supabase functions deploy sync-statistics --no-verify-jwt`.
5. Comprueba la primera descarga:
   `curl -X POST https://<project-ref>.supabase.co/functions/v1/sync-statistics -H "x-statistics-secret: <secreto>" -H "Content-Type: application/json" -d '{"dryRun":true}'`.
   En PowerShell escribe el cuerpo entre comillas simples (`-d '{"dryRun":true}'`): con comillas dobles y `\"` el cuerpo llega roto y la función responde `400 Invalid JSON body` en vez de escribir datos sin querer.
6. Lanza la primera sincronización real con `-d '{}'` (o espera al cron). Hasta entonces la app enseña los datos de muestra.

> ⚠️ Los secretos viven solo en el servidor. `FOOTBALL_DATA_TOKEN`, `STATISTICS_SYNC_SECRET` y `WIKI_USER_AGENT` **no** son `EXPO_PUBLIC_*` y nunca deben acabar en `.env` ni en el bundle.

## 🔔 Notificaciones push (Fase 6)

Tres avisos, todos enviados **desde el backend**: la app solo registra el dispositivo y guarda preferencias.

| Aviso | Cuándo | Detalle |
| --- | --- | --- |
| Recordatorio | ~1 hora antes del partido | Partidos del equipo favorito, con o sin pronóstico hecho |
| Resultado | Al liquidarse el pronóstico | Marcador exacto (10 puntos), goles de un equipo (5) o sin puntos |
| Ranking | Al cambiar tu posición | Ranking mundial y ligas privadas |

- **Tokens en Supabase:** la app obtiene el Expo push token y lo registra con la RPC `register_push_token()`. La tabla `push_tokens` guarda un token por dispositivo y usuario; al cerrar sesión se libera con `unregister_push_token()` para que otra cuenta en el mismo móvil no herede los avisos.
- **Preferencias:** `notification_preferences` (recordatorios, resultados y ranking; todo activado por defecto) se edita en Perfil → Notificaciones.
- **Envío:** la Edge Function `send-push` acepta `{ "job": "reminders" | "results" | "rankings" | "sync-fixtures" | "all", "dryRun": bool }`, agrupa hasta 100 mensajes por petición a Expo, borra los tokens que Expo marca como `DeviceNotRegistered` y anota cada envío en `push_deliveries` para no repetirlo. La lógica pura (textos, ventana horaria y claves de deduplicación) vive en `supabase/functions/_shared/notifications.ts` y está cubierta por Jest.
- **Recordatorios sin pronóstico:** para avisar de todos los partidos del equipo favorito el servidor necesita los horarios aunque el usuario no haya pronosticado. La tabla `fixtures` cachea el calendario del día (2 peticiones a API-Football) y el job `sync-fixtures` la refresca a las 04:20 UTC.
- **Rankings:** `ranking_positions()` calcula las posiciones del ranking mundial y de cada liga para el service role, sin exponer predicciones. Se avisa como máximo una vez cada 6 horas por ámbito y solo cuando la posición cambia de verdad; el primer cálculo únicamente guarda el estado.

Cuatro trabajos de `pg_cron` llaman a la función con el secreto compartido `notify_secret` guardado en Vault:

| Trabajo | Cadencia |
| --- | --- |
| `push-reminders` | cada 10 minutos |
| `push-results` | cada 15 minutos |
| `push-rankings` | cada hora (minuto 7) |
| `push-sync-fixtures` | diario a las 04:20 UTC |

**Puesta en marcha**

1. `npx supabase db push` (tablas, RPCs y cron).
2. `npx supabase secrets set PUSH_NOTIFY_SECRET=<secreto>` y el mismo valor en Vault:
   `select vault.create_secret('<secreto>', 'notify_secret', 'Secreto compartido de send-push');`
3. `npx supabase functions deploy send-push --no-verify-jwt`.
4. `npx eas-cli init` (escribe `extra.eas.projectId` en `app.json`) y sube las credenciales de FCM/APNs a EAS.
5. `npx eas-cli build --profile development` y arranca con `npx expo start --dev-client`.

> ⚠️ Si rotas `PUSH_NOTIFY_SECRET` o `PREDICTIONS_SETTLE_SECRET`, actualiza también el secreto de Vault (`notify_secret`, `settle_secret`) en el mismo momento. Si no coinciden, el cron recibe `401 Unauthorized` en cada ejecución y deja de enviar avisos (o de liquidar pronósticos). Se comprueba comparando el digest SHA-256 de ambos valores.

> Las notificaciones push **no funcionan en Expo Go** (desde SDK 53) ni en la versión web: necesitan un development build o una build instalada.

## 🧰 Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia Expo |
| `npm run ios` | Abre el simulador de iOS |
| `npm run android` | Abre el emulador de Android |
| `npm run web` | Abre la versión web |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Comprueba los tipos con TypeScript |
| `npm test` | Ejecuta los tests con Jest |

## 📁 Estructura

```text
AFFutbol/
├── src/
│   ├── app/                          # Rutas de Expo Router
│   │   ├── _layout.tsx               # Providers, tema y splash
│   │   ├── (tabs)/                   # Partidos, Noticias, Predicciones, Ranking, Perfil
│   │   ├── match/[id].tsx            # Detalle de partido
│   │   ├── article/[id].tsx          # Detalle de noticia o rumor
│   │   ├── statistics.tsx            # Clasificación, goleadores y resumen
│   │   ├── auth.tsx                  # Acceso (modal)
│   │   ├── auth-callback.tsx         # Retorno de OAuth y confirmación
│   │   ├── reset-password.tsx        # Recuperar contraseña (modal)
│   │   ├── edit-profile.tsx          # Editar perfil (modal)
│   │   ├── delete-account.tsx        # Eliminar cuenta (modal)
│   │   ├── legal/                    # Privacidad, condiciones y fuentes
│   │   └── +not-found.tsx
│   ├── components/                   # Design system reutilizable
│   ├── constants/                    # Tokens de diseño y tema de navegación
│   ├── features/                     # Lógica por dominio (matches, news, statistics, predictions, rankings, notifications, auth, profile, legal)
│   ├── hooks/                        # Hooks compartidos
│   ├── lib/                          # Entorno, query client y utilidades
│   └── services/                     # Clientes de APIs externas (api-football)
├── supabase/                         # Migraciones SQL y Edge Functions
├── assets/
├── app.json
├── eas.json
└── package.json
```

## 🚀 Publicación (Fase 7)

El código ya está preparado; lo que queda son acciones en las consolas de Supabase, EAS y las tiendas.

### Ya resuelto en el repositorio

- **Variables de build:** `eas.json` declara `environment` y `channel` en los tres perfiles, así que las builds leen las environment variables de EAS (`production`, `preview`, `development`) y las OTA tienen canal. La configuración no se commitea.
- **Clave de API-Football fuera del bundle:** la app llama a la Edge Function `api-football` (`EXPO_PUBLIC_API_FOOTBALL_PROXY_URL`) y la clave vive en el secreto `API_FOOTBALL_KEY`. La función solo acepta los endpoints y parámetros que usa la app (`supabase/functions/_shared/api-football-proxy.ts`), así que no es un proxy abierto.
- **Apple Sign In** solo se muestra en iOS, donde existe el módulo nativo; en Android y web se oculta en vez de ofrecer un flujo que falla.
- **Eliminar cuenta desde la app** (Apple 5.1.1(v)): Perfil → Eliminar cuenta pide escribir `ELIMINAR` y la Edge Function `delete-account` borra la cuenta, el perfil, los pronósticos, las ligas y el token de notificaciones. Falta desplegar la función.
- **Textos legales** de privacidad, condiciones de uso y fuentes con una única fuente (`src/features/legal/documents.ts`), enlazados desde Perfil y desde el acceso, y publicables en la web.

### Pendiente (acción manual)

1. **Desplegar el proxy y guardar la clave:**
   ```bash
   npx supabase secrets set API_FOOTBALL_KEY=...
   npx supabase functions deploy api-football
   ```
2. **Subir de plan de API-Football.** El proxy oculta la clave, pero el plan Free sigue siendo 100 peticiones al día: con usuarios reales se agota el mismo día.
3. **Variables en EAS** (entorno `production`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_FOOTBALL_PROXY_URL` y `EXPO_PUBLIC_EAS_PROJECT_ID`. Sin ellas la build publicada arranca con datos simulados y sin login.
   ```bash
   npx eas-cli env:set --environment production --name EXPO_PUBLIC_API_FOOTBALL_PROXY_URL --value https://<ref>.supabase.co/functions/v1/api-football --visibility plaintext
   npx eas-cli env:list --environment production
   ```
4. **Supabase → Authentication → URL Configuration:** quitar `exp://**` (era solo para Expo Go) y dejar `affutbol://**`.
5. **SMTP propio** en Supabase para la confirmación de email y el reset de contraseña; el SMTP por defecto tiene límites de prueba.
6. **Proveedores de login:** publicar el consent screen de Google (deja de estar en *Testing*) y subir la APNs key a EAS para el push en iOS.
7. **Desplegar la baja de cuenta:** `npx supabase functions deploy delete-account`. La función verifica el JWT por defecto; sin desplegarla, Perfil → Eliminar cuenta responde 404.

### Bloque de tienda (siguiente)

- Iconos y splash definitivos, ficha de tienda con capturas de iPhone e iPad y atribución de fuentes.
- Publicar las URLs legales del build web (`/legal/privacidad`, `/legal/terminos`, `/legal/fuentes`) y completar los datos pendientes de `docs/publicacion/legales.md` (buzones, región de hosting, revisión legal).

## 🗺️ Roadmap

- [x] **Fase 0:** cimientos, branding, navegación y tooling
- [x] **Fase 1:** partidos del día y detalle de partido
- [x] **Fase 2:** noticias, estadísticas y rumores
- [x] **Fase 3:** autenticación y perfil
- [x] **Fase 4:** sistema de predicciones
- [x] **Fase 5:** ranking mundial y ligas privadas
- [x] **Fase 6:** notificaciones push
- [ ] **Fase 7:** publicación en App Store

## 🎨 Branding

La app usa una paleta verde césped con acentos ámbar, en modo claro y oscuro. Los iconos y el splash son provisionales; se sustituirán por los definitivos antes de la publicación.

## 👤 Autor

Desarrollado por **Alejandro Fernández Franco**.

## 📄 Licencia

MIT. Consulta [`AFFutbol/LICENSE`](AFFutbol/LICENSE).
