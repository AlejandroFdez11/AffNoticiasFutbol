# Atribución de fuentes y revisión de derechos (ítem 12)

La app publica una versión resumida de este documento en `/legal/fuentes` (fuente única: `AFFutbol/src/features/legal/documents.ts`). La licencia del repo es **propietaria** (`LICENSE` en la raíz): cubre el código y la marca propios, y **no** da ningún derecho sobre contenidos de terceros.

| Fuente | Qué se usa | Cómo se usa | Atribución / condición |
| --- | --- | --- | --- |
| [API-Football](https://www.api-football.com/) (api-sports) | Partidos, marcadores, eventos, alineaciones, estadísticas | La Edge Function `api-football` consulta solo los endpoints permitidos; el móvil no lleva la clave | Plan Free (100 peticiones/día) decidido para testing interno. Mantener el aviso «Datos de partidos: API-Football» y reconsiderar el plan antes de publicar al público. |
| [football-data.org](https://www.football-data.org/) | Clasificaciones de PD, PL, SA y BL1 | `sync-statistics` descarga `/v4/competitions/{code}/standings` dos veces al día y guarda la instantánea en Supabase | El plan gratuito pide atribución: «Football data provided by the Football-Data.org API». Ya está en la pantalla de fuentes. |
| [Wikipedia en inglés](https://en.wikipedia.org/) | Tabla «Top goalscorers», solo goles | `sync-statistics` extrae jugador, club y goles; la app no reproduce el artículo | Texto bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es). Se enlaza la licencia y la fuente; si se copiara texto, habría que compartir bajo la misma licencia. |
| Marca | Feeds `portada.xml`, `primera-division.xml`, `futbol-internacional.xml`, `mercado-fichajes.xml` | Solo titular, extracto, imagen enlazada y enlace al medio; 14 días de retención | Ver revisión más abajo. |
| Mundo Deportivo | Feed `rss/futbol` | Igual que Marca | Ver revisión más abajo. |
| Relevo | Feed `rss` | Igual que Marca | Ver revisión más abajo. |
| 20minutos | Feed `rss/deportes/futbol/` | Igual que Marca | Ver revisión más abajo. |
| La Vanguardia | Feed `rss/deportes/futbol.xml` | Igual que Marca | Ver revisión más abajo. |
| ESPN | Feed `espn/rss/soccer/news` (español, cobertura internacional) | Igual que Marca | Ver revisión más abajo. |
| Clubes, ligas, federaciones | Escudos y nombres de equipos | Identificación de equipos en partidos, clasificaciones y pronósticos | Marcas de sus titulares. Aviso de no afiliación en `/legal/fuentes`, en Condiciones y en la descripción de la tienda. |

## Revisión pendiente de los RSS (Marca / Mundo Deportivo / Relevo / 20minutos / La Vanguardia / ESPN)

Antes de publicar, revisar **las condiciones de uso y la política de derechos de cada medio** (o pedir autorización por escrito). Puntos a verificar:

- [ ] Aceptan la reutilización de titulares y extracts mediante RSS y la creación de un agregador con enlace al original.
- [ ] La imagen se está **enlazando en caliente** desde el CDN del medio (`image_url` viene del feed y `expo-image` la carga por URL). Algunos medios lo prohíben. Alternativas: no mostrar imagen, usar una imagen propia con licencia o pedir permiso.
- [ ] El extracto no supera lo que el feed publica y nunca se reproduce el cuerpo del artículo (ya es así en `supabase/functions/_shared/normalize.ts`).
- [ ] Existe un procedimiento de retirada rápida: correo `alejandrofdezfr9@gmail.com` + desactivar la fuente con un `UPDATE news_sources SET enabled = false WHERE id = ...` (no hace falta desplegar).
- [ ] Se respeta `robots.txt`, el throttling de 10 minutos por fuente, la cadencia del cron (30 minutos) y un `User-Agent` identificativo (ya configurado).
- [ ] La retención de 14 días y el límite de 60 piezas siguen siendo aceptables.
- [ ] Si algún medio se opone, quitar su feed y sus noticias antes de la fecha de envío a revisión.

## Escudos e imágenes

Los escudos vienen de las URLs que devuelven las APIs, no se redistribuyen como archivos propios. Aun así, son marcas registradas: úsalos solo para identificar equipos, sin sugerir patrocinio. Si un titular lo pide, se sustituyen por las iniciales (el código ya tiene ese fallback en estadísticas).

Esta revisión es una comprobación técnica y editorial, no asesoramiento legal. Si la app va a tener tráfico real, que la revise alguien con criterio jurídico.
