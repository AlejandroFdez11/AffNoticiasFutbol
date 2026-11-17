# Ficha de tienda y cuenta de demostración (ítem 11)

## Metadatos propuestos (App Store)

| Campo | Valor |
| --- | --- |
| Nombre | AFFutbol |
| Subtítulo (30 car.) | Fútbol, pronósticos y ranking |
| Texto promocional (170 car.) | Sigue los partidos de tu equipo, acierta el marcador y compite en el ranking mundial y en ligas privadas con tus amigos. Sin apuestas y sin coste. |
| Categoría principal | Deportes |
| Categoría secundaria | Ninguna |
| Copyright | © 2026 Alejandro Fernández Franco |
| URL de privacidad | `https://affutbol.app/legal/privacidad` |
| URL de soporte | `https://affutbol.app/soporte` (hay que crear la página) |
| Contrato / licencia | Estándar de Apple; adjuntar las condiciones propias si se usa EULA personalizada |
| ID de Apple | El de la cuenta del desarrollador |

**Palabras clave (100 car., sin espacios):**

```text
futbol,pronosticos,ligas,ranking,noticias,fichajes,clasificacion,goles,equipos,partidos
```

## Descripción (copiar/pegar)

```text
AFFutbol es el lugar donde seguir el fútbol y competir con tus amigos, sin apuestas y sin pagar nada.

PARTIDOS DEL DÍA
Los encuentros de las grandes ligas y copas, agrupados por competición, con marcador en directo, eventos, alineaciones dibujadas sobre el campo y estadísticas. Elige tu equipo favorito y tenlo siempre a mano.

NOTICIAS Y RUMORES
Actualidad, análisis y mercado en un solo feed, con filtros y enlace al medio original. Solo mostramos titular, extracto e imagen: el artículo completo se lee en la web del medio.

ESTADÍSTICAS REALES
Clasificación de LaLiga, Premier League, Serie A y Bundesliga con puntos, diferencia de goles, forma y escudos, además de la tabla de goleadores. Los datos se actualizan dos veces al día.

PRONÓSTICOS
Pronostica el marcador de los partidos de tu equipo antes de que empiecen. Acierto exacto: 10 puntos. Aciertas los goles de un equipo: 5 puntos. Los puntos los calcula el servidor al terminar el partido, sin que puedas manipularlos.

RANKING Y LIGAS PRIVADAS
Compite en el ranking mundial o crea una liga privada con un código de invitación de 6 caracteres para jugar con tus colegas o compañeros de trabajo.

NOTIFICACIONES
Recibe un aviso antes de los partidos de tu equipo, cuando se liquidan tus pronósticos y cuando cambia tu posición. Puedes desactivar cada tipo cuando quieras.

TU CUENTA, TUS DATOS
Tu perfil, tus pronósticos y tus ligas se guardan en Supabase. Puedes editar tu perfil y eliminar tu cuenta de forma permanente desde la propia app: Perfil → Eliminar cuenta.

AFFutbol es un proyecto independiente y no está afiliado a LaLiga, la RFEF, la UEFA, la FIFA ni a ningún club. Los datos de partidos proceden de API-Football, las clasificaciones de football-data.org y los goleadores de Wikipedia.
```

## Clasificación por edad

Responde el cuestionario con fidelidad; no marques 4+ automáticamente: la app tiene nombres de usuario y de liga visibles para otros usuarios y abre enlaces a medios externos. Esas respuestas pueden elevar la clasificación. No hay violencia, lenguaje obsceno, apuestas, compras ni contenido sexual.

## Capturas

Obligatorias porque `ios.supportsTablet = true` en `app.json`:

| Plataforma | Tamaño | Número |
| --- | --- | --- |
| iPhone 6,9" | 1320 × 2868 px (o 1290 × 2796) | 3–10 |
| iPad 13" | 2064 × 2752 px | 3–10 |
| iPhone 6,5" | 1284 × 2778 px | Opcional si se entregan las de 6,9" |
| Google Play (móvil) | al menos 2 capturas, 320–3840 px | 2–8 |
| Google Play (icono) | 512 × 512 px PNG de 32 bits | 1 |
| Google Play (graphic) | 1024 × 500 px JPEG/24-bit PNG | 1 |

Guion sugerido (mismo orden en iPhone y iPad, sin recortes raros):

1. **Partidos del día** con el listado agrupado por competición y el marcador en directo.
2. **Detalle de partido** con alineaciones sobre el campo.
3. **Predicciones**: marcador pronosticado y puntos.
4. **Ranking mundial** con la posición del usuario resaltada.
5. **Liga privada** con el código de invitación y la tabla.
6. **Perfil** (muestra que la cuenta se puede editar y eliminar).
7. **Estadísticas**: clasificación y goleadores.

> Las capturas deben salir de un build de producción con datos reales o de demostración coherentes. Si se usa la cuenta demo, no aparezcan correos ni tokens personales.

## Cuenta de demostración para el revisor

Crear una cuenta específica para revisión y mantenerla activa hasta que se apruebe la app:

1. Registro con `demo@<tu-dominio>` y contraseña larga guardada en el gestor de secretos del equipo (nunca en el repo ni en la ficha pública de GitHub).
2. Editar el perfil: nombre visible «Demo AFF», nombre de usuario `demo_aff` y equipo favorito con partidos próximos (por ejemplo, Barcelona o Real Madrid).
3. Hacer un pronóstico para que Ranking y Predicciones muestren datos reales.
4. Crear una liga privada de prueba con un nombre neutral y guardar su código para las capturas.
5. Activar las notificaciones en el dispositivo de captura si se quiere mostrar esa pantalla.
6. No borrar la cuenta demo hasta pasado el lanzamiento; el revisor puede necesitarla para probar también el borrado (si lo hace, créala de nuevo).

En App Store Connect → **Información de revisión**: marcar «Se requiere iniciar sesión», poner usuario y contraseña y pegar estas notas:

```text
EN / ES

Sign-in is required. Use the demo credentials provided in the App Review Information fields.

AFFutbol is a free football companion app. Partidos (matches), Noticias (news) and Estadisticas (statistics) can be browsed without an account. Predicciones (predictions), Ranking (global and private leagues) and Perfil (profile) require signing in.

The demo account has a favourite team, one prediction and a private league so all signed-in screens can be reviewed.

Account deletion (required by guideline 5.1.1(v)): open Perfil > Eliminar cuenta, type ELIMINAR and confirm. The account and all associated data are deleted immediately. Do not delete the demo account until you have finished the review.

Privacy policy: https://affutbol.app/legal/privacidad
Terms: https://affutbol.app/legal/terminos

---

Es necesario iniciar sesión. Usa las credenciales de demostración de los campos de información de revisión.

Partidos, Noticias y Estadísticas se pueden consultar sin cuenta. Predicciones, Ranking (mundial y ligas privadas) y Perfil requieren iniciar sesión.

La cuenta demo tiene equipo favorito, un pronóstico y una liga privada para poder revisar todas las pantallas.

Borrado de cuenta (norma 5.1.1(v)): Perfil > Eliminar cuenta, escribe ELIMINAR y confirma. La cuenta y todos sus datos se borran de inmediato. No elimines la cuenta demo hasta terminar la revisión.

Privacidad: https://affutbol.app/legal/privacidad
Condiciones: https://affutbol.app/legal/terminos
```

## Enlaces que deben existir antes de enviar

- `https://affutbol.app/soporte` (ficha de tienda).
- `https://affutbol.app/legal/privacidad`, `/legal/terminos` y `/legal/fuentes`.
- Las URL de retorno de Supabase (`affutbol://**`) permitidas y `exp://**` retirada en producción.
