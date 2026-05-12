# Recordatorios Recurrentes

Una aplicación móvil en React Native para programar recordatorios diarios recurrentes y gestionar tareas completadas.

## Opción elegida: Recordatorios

Este proyecto implementa un sistema de gestión de recordatorios, cumpliendo con los requisitos de la opción "Recordatorios".

## Funcionalidades implementadas

- **Login, Registro de nuevos usuarios**: Sistema de autenticación con guardado persistente.
- **Creación, visualización, eliminación de recordatorios**: Interfaz para agregar tareas, dividiendo la visualización entre tareas activas (ordenadas por horario) y completadas.
- **Notificaciones de recordatorios en el momento seteado**: Integración nativa que lanza notificaciones push locales en el dispositivo del usuario de forma puntual o con repetición diaria.

- **Demo video**: [Demo](https://drive.google.com/file/d/1nGCOjWxCeODlvYzre_r5Bx3lGb2axTk1/view)

## Requisitos previos

- Node.js instalado.
- Android Studio / Android SDK (para el emulador de Android) o Xcode (para el simulador de iOS).
- Expo CLI o la aplicación Expo Go en tu dispositivo físico.

## Cómo ejecutar la app

1. **Instalar las dependencias**

   ```bash
   npm install
   ```

2. **Iniciar el Metro Bundler**

   ```bash
   npm run start
   ```

   *(Nota: Si necesitas especificar la ruta de tu Android SDK en Linux, puedes ejecutar `ANDROID_HOME=/ruta/al/sdk npm run start`)*

3. **Lanzar la App**
   Una vez que el bundler esté en ejecución, puedes:
   - Presionar **`a`** en tu terminal para abrir la aplicación en un Emulador de Android.
   - Presionar **`i`** para abrir la aplicación en un Simulador de iOS.
   - Escanear el **Código QR** con la cámara de tu teléfono (iOS) o la aplicación Expo Go (Android) para ejecutarla en un dispositivo físico.

> **Nota:** La aplicación genera automáticamente usuarios falsos (ej. correo: `admin@example.com` / contraseña: `admin`) y 25 recordatorios de prueba en el almacenamiento local la primera vez que se ejecuta, permitiéndote probar la interfaz inmediatamente sin tener que cargar datos a mano.
