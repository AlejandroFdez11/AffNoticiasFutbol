# Envío a Google Play (en espera)

> **Estado 23/11/2026:** el titular ha decidido **no pagar el registro de Google Play Console**, así que no se enviará a Play. Este documento se conserva como referencia para el día que se reactive. La distribución actual es **interna con EAS** (APK), descrita en [`verificacion-y-pulido.md`](verificacion-y-pulido.md).

La app está dada de alta en Google Play Console con el package `com.alejandroff.affutbol` y `eas.json` conserva `submit.production.android.track = "internal"` para el futuro. La build AAB de producción está terminada, pero **no se ha enviado**.

## Build AAB de producción (no enviada)

- ID: `438dfa99-2bb0-4bce-9e2f-e84359d09a75`
- Perfil: `production`
- `versionCode`: 3 (autoincrement desde 2)
- Canal EAS Update: `production`
- Build anterior: `4d38ec09-1e83-4c45-8409-5b216c41fbba` (`versionCode` 2, commit `ebe3721`)
- AAB: https://expo.dev/artifacts/eas/rzGKL1z8uwhMMyzdaxz49cjaro_hH1gTQ6zwg1Vvi1s.aab

## 1. Crear la cuenta de servicio (una sola vez)

1. Abre Google Cloud Console y selecciona el proyecto vinculado a Play Console (o crea uno).
2. **APIs y servicios → Biblioteca** y habilita **Google Play Android Developer API**.
3. **APIs y servicios → Credenciales → Crear credenciales → Cuenta de servicio**.
4. Ponle un nombre claro, por ejemplo `eas-submit-affutbol`, y crea una **clave JSON**.
5. Guarda el JSON en tu máquina. **No lo subas al repo ni lo pegues en el chat.**
6. Copia el email de la cuenta de servicio (termina en `.iam.gserviceaccount.com`).
7. En Play Console entra en **Usuarios y permisos → Invitar a nuevo usuario**, pega ese email y dale permiso de **Release manager** sobre la app AFFutbol. Acepta la invitación desde la cuenta de servicio si Google la pide.

## 2. Enviar el AAB

Desde `AFFutbol/`:

```bash
npx eas-cli submit --platform android --profile production --latest
```

EAS te pedirá la clave de cuenta de servicio: elige la opción de subirla e indica la ruta al JSON descargado. Después confirma el package y el carril `internal`.

Si el comando dice que la app no existe, comprueba que el package en Play Console es exactamente `com.alejandroff.affutbol`.

## 3. Verificar en Play Console

1. **Testing → Internal testing → Releases**: debe aparecer la versión `1.0.0 (3)` en estado *Reviewing/Active*.
2. Añade correos de prueba en **Testers → Internal testing** y comparte el enlace de opt-in.
3. Instala desde Play Store con un tester y comprueba el flujo completo (login, pronósticos, ligas, push, borrado de cuenta, modo oscuro y offline).

## Problemas habituales

- **`Google Service Account Keys cannot be set up in --non-interactive mode`**: ejecuta el comando sin `--non-interactive` y sube la clave cuando te la pida.
- **403 al subir**: la cuenta de servicio no tiene permiso de *Release manager* en esa app, o falta habilitar la Google Play Android Developer API.
- **El package no coincide**: el AAB lleva `com.alejandroff.affutbol`; no se puede cambiar después del primer upload.
