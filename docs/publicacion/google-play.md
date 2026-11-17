# Envío a Google Play (testing interno)

La app ya existe en Google Play Console con el package `com.alejandroff.affutbol`. La build de producción de Android está terminada y `eas.json` tiene `submit.production.android.track = "internal"`, así que el envío va al carril **Internal testing**.

## Build actual

- ID: `4d38ec09-1e83-4c45-8409-5b216c41fbba`
- Perfil: `production`
- `versionCode`: 2
- Canal EAS Update: `production`
- Commit: `ebe3721`

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

1. **Testing → Internal testing → Releases**: debe aparecer la versión `1.0.0 (2)` en estado *Reviewing/Active*.
2. Añade correos de prueba en **Testers → Internal testing** y comparte el enlace de opt-in.
3. Instala desde Play Store con un tester y comprueba el flujo completo (login, pronósticos, ligas, push, borrado de cuenta, modo oscuro y offline).

## Problemas habituales

- **`Google Service Account Keys cannot be set up in --non-interactive mode`**: ejecuta el comando sin `--non-interactive` y sube la clave cuando te la pida.
- **403 al subir**: la cuenta de servicio no tiene permiso de *Release manager* en esa app, o falta habilitar la Google Play Android Developer API.
- **El package no coincide**: el AAB lleva `com.alejandroff.affutbol`; no se puede cambiar después del primer upload.
