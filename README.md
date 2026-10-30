# ⚽ AFFutbol

**AFFutbol** es una aplicación móvil para seguir el fútbol al día y competir con tus amigos y compañeros de trabajo haciendo predicciones de los partidos de tu equipo.

## ✨ Características

- **Partidos del día:** todos los encuentros de la jornada en un solo lugar, con resultados en directo.
- **Noticias:** actualidad futbolística centralizada.
- **Estadísticas:** datos de equipos, jugadores y competiciones.
- **Rumores:** mercado de fichajes y últimas filtraciones.
- **Predicciones:** pronostica los partidos de tu equipo favorito y suma puntos según tus aciertos.
- **Rankings:**
  - 🌍 **Ranking mundial** entre todos los usuarios.
  - 👥 **Ranking privado** para competir con tus colegas o compañeros del curro.

## 📊 Estado del proyecto

| Fase | Estado |
| --- | --- |
| Fase 0 — Cimientos y navegación | ✅ Completada |
| Fase 1 — Partidos del día y detalle | 🚧 Siguiente |
| Fase 2 — Noticias, estadísticas y rumores | ⏳ Pendiente |
| Fase 3 — Autenticación y perfil | ⏳ Pendiente |
| Fase 4 — Predicciones | ⏳ Pendiente |
| Fase 5 — Rankings y ligas privadas | ⏳ Pendiente |
| Fase 6 — Notificaciones push | ⏳ Pendiente |
| Fase 7 — Pulido y publicación | ⏳ Pendiente |

## 🛠️ Stack tecnológico

- **Framework:** [Expo SDK 58](https://docs.expo.dev/) + React Native 0.88
- **Lenguaje:** TypeScript (modo estricto)
- **UI:** React Native + Expo Router (native tabs)
- **Estado del servidor:** TanStack Query
- **Fechas:** date-fns (locale español)
- **Backend / auth:** [Supabase](https://supabase.com/) (Fase 3)
- **Datos de fútbol:** [API-Football](https://www.api-football.com/) (api-sports)

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
| `EXPO_PUBLIC_API_FOOTBALL_KEY` | API key de API-Football | vacío |
| `EXPO_PUBLIC_API_FOOTBALL_BASE_URL` | URL base de la API | `https://v3.football.api-sports.io` |
| `EXPO_PUBLIC_USE_MOCKS` | Fuerza el uso de datos simulados | `true` si no hay key |

> ⚠️ Las variables `EXPO_PUBLIC_*` se incluyen en el bundle. No guardes secretos privados ahí. Antes de publicar, las llamadas a API-Football se moverán a una Edge Function de Supabase.

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
├─ src/
│  ├─ app/                  # Rutas de Expo Router
│  │  ├─ _layout.tsx        # Providers, tema y splash
│  │  ├─ (tabs)/            # Partidos, Noticias, Predicciones, Ranking, Perfil
│  │  └─ +not-found.tsx
│  ├─ components/           # Design system reutilizable
│  ├─ constants/            # Tokens de diseño y tema de navegación
│  ├─ features/             # Lógica por dominio (partidos, noticias, ...)
│  ├─ hooks/                # Hooks compartidos
│  ├─ lib/                  # Entorno, query client y utilidades
│  └─ services/             # Clientes de APIs externas
├─ assets/
├─ app.json
├─ eas.json
└─ package.json
```

## 🗺️ Roadmap

- [x] **Fase 0:** cimientos, branding, navegación y tooling
- [ ] **Fase 1:** partidos del día y detalle de partido
- [ ] **Fase 2:** noticias, estadísticas y rumores
- [ ] **Fase 3:** autenticación y perfil
- [ ] **Fase 4:** sistema de predicciones
- [ ] **Fase 5:** ranking mundial y ligas privadas
- [ ] **Fase 6:** notificaciones push
- [ ] **Fase 7:** publicación en App Store

## 🎨 Branding

La app usa una paleta verde césped con acentos ámbar, en modo claro y oscuro. Los iconos y el splash son provisionales; se sustituirán por los definitivos antes de la publicación.

## 👤 Autor

Desarrollado por **Alejandro Fernández Franco**.

## 📄 Licencia

Pendiente de definir.
