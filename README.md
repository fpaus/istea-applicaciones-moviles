# Recordatorios Recurrentes (Tasks & Projects)

Una aplicación móvil interactiva desarrollada en **React Native + Expo** para la gestión de proyectos, tareas jerárquicas y recordatorios diarios recurrentes con sincronización al calendario nativo.

## Funcionalidades Implementadas

La aplicación se estructura en torno a una arquitectura resiliente y un sistema de almacenamiento local offline-first (persistencia local con Zustand y AsyncStorage). Las funcionalidades implementadas son:

### 1. Gestión de Proyectos (Local)

* **Creación y Selección Instantánea**: Los usuarios pueden crear proyectos y cambiar de proyecto activo directamente desde el selector en la cabecera (*HeaderProjectSwitcher*) sin interrumpir su navegación actual.
* **Renombrado con validación**: Comprobación en tiempo real para evitar nombres de proyectos duplicados (insensible a mayúsculas y minúsculas).
* **Eliminación en cascada**: Al eliminar un proyecto, se eliminan todas sus tareas, subtareas asociadas y notificaciones programadas, previa confirmación interactiva.

### 2. Gestión de Tareas y Subtareas Jerárquicas

* **Árbol de tareas ilimitado**: Estructura jerárquica nativa que permite anidar subtareas de forma ilimitada bajo cualquier tarea mediante un identificador `parentId`.
* **Barra de progreso de subtareas**: Visualización visual del progreso de subtareas completadas en el dashboard (`CardItem`) y en la pantalla de detalle (`detail.tsx`).
* **Invariante de completado**:
  * Completar una tarea con subtareas abiertas solicita confirmación para completarlas todas en cascada.
  * Completar la última subtarea sugiere completar de forma automática la tarea padre.
  * Reabrir una subtarea reabre automáticamente todas sus tareas ancestros en la jerarquía.

### 3. Recordatorios y Notificaciones Locales (Nativo)

* **Configuración flexible**: Programación de recordatorios a una hora específica con opción de repetición diaria (notificación recurrente) o puntual (una sola vez).
* **Clasificación automática**: En el dashboard, las tareas activas se ordenan dinámicamente poniendo primero las que tienen recordatorio (ordenadas por el horario más próximo) y luego las tareas sin recordatorio (ordenadas por fecha de creación).
* **Resiliencia**: En caso de denegación de permisos o error del planificador del sistema operativo, la tarea se guarda de todos modos de forma segura con el identificador en `null`.

### 4. Adjuntar Imágenes (Nativo)

* **Galería nativa**: Permite seleccionar y previsualizar una imagen de la galería de fotos a nivel de formulario, guardándola como una referencia local (`imageUri`) en el dispositivo.
* **Indicador visual**: Se muestra una miniatura (thumbnail) de la imagen en la tarjeta del dashboard y la imagen completa en la pantalla de detalle.

### 5. Captura y Selección de Ubicación (Nativo)

* **Ubicación GPS actual**: Obtención automatizada de la ubicación del dispositivo en un solo toque mediante `expo-location`.
* **Selección manual con etiquetas**: Permite buscar o ingresar manualmente una etiqueta de ubicación personalizada o coordenadas geográficas (`LocationSelectionModal`).

### 6. Asignación de Responsables (Nativo)

* **Integración con Contactos**: Selector integrado con la agenda de contactos del dispositivo nativo (`expo-contacts`), que retrocede de forma fluida a una lista in-app en caso de incompatibilidades del sistema operativo.
* **Snapshot de seguridad**: Se almacena un clon (snapshot) de los datos del contacto asignado (nombre, teléfono, correo electrónico) directamente en el recordatorio, de modo que la tarea mantiene su información intacta aunque el contacto de la agenda sea modificado o eliminado.

### 7. Sincronización con el Calendario Nativo (`expo-calendar`)

* **Sincronización en tiempo real**: Al habilitar la opción "Agregar al calendario", la aplicación crea un calendario dedicado llamado "Recurring Reminders" y sincroniza los recordatorios en lockstep con su ciclo de vida (creación, edición de hora/título, completado, reapertura y eliminación).
* **Invitación a Responsables**: Si el responsable seleccionado tiene una dirección de correo electrónico válida configurada, se le asocia e invita automáticamente como participante (*Attendee*) requerido en el evento de calendario generado.

### 8. Compatibilidad y Desgradación en Web (SPA)

* **Modo SPA (Single Page Application)**: Configuración optimizada que permite ejecutar toda la lógica de almacenamiento local en navegadores web sin necesidad de renderizado en servidor.
* **Degradación elegante**: Los módulos nativos de notificaciones y calendario de Expo se deshabilitan limpiamente en web mediante guardas de plataforma, permitiendo la creación y edición normal de tareas sin riesgos de cuelgues del navegador.

---

* **Demo video**: [Demo](https://drive.google.com/file/d/1viPD6LWCJKy4t5KQqQyszs56Yi3g_yoF/view)

## Requisitos Previos

* Node.js instalado (v18 o superior recomendado).
* Android Studio / Android SDK (para ejecutar en el Emulador de Android) o Xcode (para el Simulador de iOS).
* La aplicación **Expo Go** instalada en tu dispositivo físico si deseas probar de forma física.

## Cómo Ejecutar la App

1. **Instalar las dependencias**

    ```bash
    npm install
    ```

2. **Iniciar el Metro Bundler de Expo**

    ```bash
    npm run start
    ```

3. **Lanzar la Aplicación en tu Entorno**
    Una vez que el bundler esté en ejecución en tu terminal, puedes:
    * Presionar **`a`** para abrir la aplicación en el Emulador de Android.
    * Presionar **`i`** para abrir la aplicación en el Simulador de iOS.
    * Presionar **`w`** para iniciar y navegar en el navegador web local.
    * Escanear el **Código QR** generado con la cámara de tu teléfono (iOS) o con la aplicación Expo Go (Android) para ejecutarla directamente en un dispositivo físico.

---

## Uso de IA

La documentación del uso de la IA se encuentra en [IA_USAGE.md](IA_USAGE.md).

---

> **Nota:** Dado que toda la información se guarda de manera persistente de forma local, en el primer inicio de la aplicación se te solicitará ingresar el nombre de tu primer proyecto de tareas. A partir de allí, tus cambios se guardarán automáticamente en cada modificación.
