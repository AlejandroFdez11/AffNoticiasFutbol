# Iconos y splash (ítem 10)

## Estado real del repo

Los recursos de la plantilla de Expo han sido sustituidos por arte propio con el concepto **escudo + balón**, en la paleta de marca (`#0B7A4B`, `#07120D`, `#B76E00`). Los másteres SVG están en `AFFutbol/assets/brand/` y de ahí se exportan los PNG:

| Archivo | Tamaño | Origen |
| --- | --- | --- |
| `AFFutbol/assets/brand/icon-master.svg` | 1024 × 1024 | Máster del icono: fondo verde, escudo oscuro con borde ámbar y balón ámbar |
| `AFFutbol/assets/images/icon.png` | 1024 × 1024 | Exportado desde `icon-master.svg`. Icono general y, ahora también, de iOS |
| `AFFutbol/assets/brand/android-foreground.svg` | 512 × 512 | Máster del primer plano adaptativo (transparente) |
| `AFFutbol/assets/images/android-icon-foreground.png` | 512 × 512 | Primer plano adaptativo de Android |
| `AFFutbol/assets/brand/android-background.svg` | 512 × 512 | Fondo liso de marca |
| `AFFutbol/assets/images/android-icon-background.png` | 512 × 512 | Fondo adaptativo de Android |
| `AFFutbol/assets/brand/android-monochrome.svg` | 432 × 432 | Silueta blanca con recorte del balón |
| `AFFutbol/assets/images/android-icon-monochrome.png` | 432 × 432 | Icono monocromo para temas de Android |
| `AFFutbol/assets/brand/splash-master.svg` | 512 × 512 | Máster del splash (transparente, contraste sobre `#07120D`) |
| `AFFutbol/assets/images/splash-icon.png` | 512 × 512 | Imagen del splash, con `imageWidth: 96` en `app.json` |
| `AFFutbol/assets/images/favicon.png` | 512 × 512 | Favicon web, exportado desde `icon-master.svg` |

En `app.json` se eliminó `ios.icon` (`./assets/expo.icon`), que seguía apuntando al icono de plantilla con degradado azul y translucencia. iOS usa ahora `icon.png`, igual que el icono general. La carpeta `assets/expo.icon/` queda como residuo sin uso; se puede borrar en una limpieza futura.

## Regeneración

Los PNG se generaron con `sharp-cli` desde los SVG, sin añadir dependencias al proyecto:

```bash
npx --yes sharp-cli -i assets/brand/icon-master.svg -o assets/images/icon.png resize 1024 1024
npx --yes sharp-cli -i assets/brand/android-foreground.svg -o assets/images/android-icon-foreground.png resize 512 512
npx --yes sharp-cli -i assets/brand/android-background.svg -o assets/images/android-icon-background.png resize 512 512
npx --yes sharp-cli -i assets/brand/android-monochrome.svg -o assets/images/android-icon-monochrome.png resize 432 432
npx --yes sharp-cli -i assets/brand/splash-master.svg -o assets/images/splash-icon.png resize 512 512
npx --yes sharp-cli -i assets/brand/icon-master.svg -o assets/images/favicon.png resize 512 512
```

## Comprobación antes de enviar

1. `npx expo-doctor` y `npx expo start -c` (limpia la caché después de cambiar recursos).
2. `npx expo export --platform ios` y `npx expo export --platform web` sin errores.
3. Build de producción instalada: revisar icono adaptativo y temático en Android, y splash con modo claro/oscuro.
4. Ninguna captura de tienda debe mostrar los iconos antiguos.
