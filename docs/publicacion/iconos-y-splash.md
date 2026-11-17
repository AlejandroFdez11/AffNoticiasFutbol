# Iconos y splash (ítem 10)

## Estado real del repo

Los recursos actuales **son los de la plantilla de Expo**, no los de AFFutbol. Es el motivo habitual de rechazo «icono provisional»:

| Archivo | Tamaño | Observación |
| --- | --- | --- |
| `AFFutbol/assets/images/icon.png` | 1024 × 1024 | Color medio azul `#3594EE`: icono de Expo. Se usa como icono general y en Android. |
| `AFFutbol/assets/expo.icon/icon.json` | — | Referencia a `expo-symbol 2.svg` + `grid.png` con degradado azul. `app.json` lo usa como `ios.icon`, así que iOS muestra el icono de la plantilla. |
| `AFFutbol/assets/images/android-icon-background.png` | 512 × 512 | Color medio `#E5F3FE`: fondo azul claro de la plantilla. |
| `AFFutbol/assets/images/android-icon-foreground.png` | 512 × 512 | Símbolo de Expo sobre fondo oscuro. |
| `AFFutbol/assets/images/android-icon-monochrome.png` | 432 × 432 | Icono monocromo de la plantilla (para iconos temáticos). |
| `AFFutbol/assets/images/splash-icon.png` | 228 × 213 | Imagen pequeña y no cuadrada; con `imageWidth: 96` se verá borrosa en pantallas @3x. |
| `AFFutbol/assets/images/favicon.png` | 48 × 48 | Icono de la plantilla para la web. |

**Único cambio hecho en el repo:** `android.adaptiveIcon.backgroundColor` pasó de `#E6F4FE` (azul de plantilla) a `#0B7A4B` (verde de marca). El resto son archivos de arte y hay que sustituirlos antes de enviar a las tiendas.

## Qué encargar al diseño

- **Icono base:** PNG opaco de **1024 × 1024**, sin esquinas redondeadas, sin transparencia y sin texto pequeño. El sistema aplica la máscara. Paleta: verde `#0B7A4B`, verde oscuro `#07120D`, ámbar `#B76E00` (tokens de `src/constants/theme.ts`).
- **Android adaptativo:** `foregroundImage` y `backgroundImage` de 512 × 512; la parte importante debe quedar dentro del círculo central del ~66 % (el resto es sangrado). `monochromeImage` de 432 × 432, una sola silueta blanca con transparencia, legible a tamaño pequeño. Fondo liso de marca.
- **Splash:** PNG transparente de al menos **288 × 288** (ideal 512 × 512) centrado, con `imageWidth: 96` en `app.json`. Probar en claro y oscuro: el fondo del splash es `#07120D` en ambos.
- **iOS 26 (`.icon`):** o se edita `assets/expo.icon/icon.json` con los nuevos recursos en Icon Composer, o se elimina la clave `ios.icon` de `app.json` para que iOS use `icon.png`. No dejar el degradado azul ni la translucencia de plantilla.
- **Web:** `favicon.png` de 512 × 512 (se escala a 48) y, si se publica el sitio, un `apple-touch-icon` acorde.

## Comprobación antes de enviar

1. `npx expo-doctor` y `npx expo start -c` (limpia la caché después de cambiar recursos).
2. `npx expo export --platform ios` y `npx expo export --platform web` sin errores.
3. Build de producción instalada: revisar icono en iOS (modo claro, oscuro y tinted), icono adaptativo y temático en Android, y splash en energía baja y en ambos temas.
4. Ninguna captura de tienda debe mostrar los iconos antiguos.
