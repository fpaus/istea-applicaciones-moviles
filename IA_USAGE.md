# Uso de IA en el desarrollo

Este documento describe cómo trabajo con asistentes de IA (Claude Code) en este
proyecto: el flujo basado en **OpenSpec** para implementar funcionalidades nuevas
y los **loops de mejora** que uso para refinar el código una vez escrito.

No es un manual de la herramienta, sino la convención de trabajo de este repo.
Todos los comandos son *slash commands* reales de Claude Code / plugins instalados.

---

## 1. Herramientas

| Herramienta | Para qué la uso |
| --- | --- |
| **OpenSpec** (`/opsx:*`) | Dirigir cada funcionalidad nueva: explorar → proponer → implementar → verificar → archivar. Es la fuente de verdad del *qué* y el *porqué*. |
| **claude-mem** (`/claude-mem:*`) | Memoria persistente entre sesiones y carga inicial de contexto del codebase. |
| **ponytail** (`/ponytail*`) | Loop anti-sobre-ingeniería: detectar y recortar código muerto, dependencias y abstracciones especulativas. |
| **code-review** (`/code-review`) | Revisión de correctitud, seguridad y performance del diff/branch. |

Documentación viva del proyecto:

- **`openspec/CONTEXT.md`** — descripción autoritativa de qué es la app, su
  arquitectura y convenciones. Se actualiza **en el mismo change** que toca esas áreas.
- **`openspec/specs/*`** — specs vigentes por capacidad (`state-management`,
  `navigation-flow`, `web-platform-support`).

---

## 2. Flujo OpenSpec para una funcionalidad nueva

Cada funcionalidad pasa por el mismo ciclo. Los comandos se ejecutan en orden:

```
/opsx:explore  →  /opsx:propose  →  /opsx:apply  →  /opsx:verify  →  /opsx:archive
                                                                        │
                                                              /opsx:sync (opcional)
```

### 2.1 `/opsx:explore` — pensar antes de escribir

Modo de exploración: aclaro requisitos, investigo el código existente y decido el
alcance y el **orden de implementación** cuando hay varias funcionalidades. No se
escribe código de producción acá. Ejemplo real: planificar las cinco features de
tareas (detalle, imagen, ubicación, responsable, calendario) y su secuencia.

### 2.2 `/opsx:propose` — crear el change con todos sus artefactos

Genera la carpeta del change en `openspec/changes/<nombre>/` con:

- **`proposal.md`** — *Why* / *What Changes* / *Impact*.
- **`design.md`** — decisiones, *goals / non-goals*, riesgos, plan de migración.
- **`tasks.md`** — checklist de implementación y verificación.
- **`specs/<capacidad>/spec.md`** — *delta* de la spec (requisitos `ADDED` /
  `MODIFIED` con sus *scenarios*).

### 2.3 `/opsx:apply` — implementar

Implemento las tareas de `tasks.md` una por una, marcando el checklist. Reglas
fijas durante la implementación (ver §3).

### 2.4 `/opsx:verify` — validar antes de cerrar

Confirmo que la implementación coincide con proposal + specs + tasks y que pasan
todas las puertas de verificación (§4).

### 2.5 `/opsx:archive` — cerrar el change

Mueve el change a `openspec/changes/archive/<fecha>-<nombre>/`, fusiona el delta
en las specs vigentes (`openspec/specs/*`) y deja `CONTEXT.md` actualizado.

### 2.6 `/opsx:sync` — sincronizar specs (opcional)

Fusiona el delta de un change a las specs principales **sin** archivar, cuando
necesito actualizar la spec vigente antes de cerrar.

---

## 3. Reglas fijas durante la implementación

Estas reglas valen para **todo** change, estén o no escritas en el spec:

- **Consistencia y resiliencia son criterios de aceptación.** Todo efecto de SO
  (notificaciones, calendario, imagen, ubicación, contactos) va envuelto en
  try/catch y degrada a `null`/no-op: un fallo **nunca** aborta ni corrompe la
  mutación de datos.
- **TDD.** Para lógica no trivial escribo primero el test (fase *Red*) y luego la
  implementación. Ej.: tests de `renameProject` antes del código.
- **Texto de UI siempre en español**; identificadores, comentarios y logs en inglés.
- **Arquitectura por capas** (UI → hooks → stores → services → utils/types); las
  dependencias apuntan hacia abajo y los stores no se importan entre sí.
- **`CONTEXT.md` se actualiza en el mismo change** si se toca comportamiento,
  dominio, arquitectura o convenciones.

---

## 4. Puertas de verificación

Antes de archivar un change, todas deben pasar:

```bash
npm test                              # Jest: toda la suite
npx tsc --noEmit                      # TypeScript sin errores
npx expo lint                         # ESLint limpio
openspec validate <change> --strict   # artefactos OpenSpec válidos
```

---

## 5. Loops de mejora

Una vez que el código funciona, lo paso por loops de refinamiento. Son
independientes del ciclo OpenSpec y se pueden correr en cualquier momento.

### 5.1 `/claude-mem:learn-codebase` — cargar contexto

Al empezar a trabajar sobre el repo (o tras cambios grandes), hace que el agente
lea **todo** el código fuente en detalle para razonar con contexto completo.

### 5.2 `/ponytail-audit` y `/ponytail-review` — recortar sobre-ingeniería

- `/ponytail-audit`: auditoría de **todo el repo**; lista rankeada de qué borrar,
  simplificar o reemplazar por stdlib/plataforma.
- `/ponytail-review`: lo mismo pero sobre el **diff** actual.

Buscan: código muerto, dependencias que el stdlib o la plataforma ya cubren,
interfaces con una sola implementación, factories de un solo producto, *flags* y
config que nadie usa. Reporta; no aplica solo (salvo que lo pida).

### 5.3 `/code-review` — correctitud, seguridad, performance

Revisión enfocada en bugs reales, agujeros de seguridad y performance del diff o
branch (complementa a ponytail, que solo mira complejidad). `--fix` aplica los
hallazgos; `ultra` corre una revisión multi-agente más profunda.

### 5.4 Verificación manual del comportamiento

`/verify` o `/run` para levantar la app y confirmar que un cambio realmente hace
lo que debe (no solo que pasan los tests).

---

## 6. Memoria persistente (claude-mem)

El proyecto usa **claude-mem** para conservar contexto entre sesiones:

- **`/claude-mem:mem-search`** — buscar trabajo de sesiones anteriores
  ("¿ya resolvimos esto?", "¿cómo lo hicimos la última vez?").
- Cada change y decisión queda registrado como *observación*, así que una sesión
  nueva arranca con el historial del proyecto ya cargado.
- Las reglas fijas (como el criterio de consistencia/resiliencia) viven en la
  memoria del proyecto y se aplican en cada sesión.

---

## 7. Resumen del ciclo completo

```
/claude-mem:learn-codebase        ── cargar contexto (al iniciar)
        │
/opsx:explore                     ── pensar el alcance y el orden
        │
/opsx:propose                     ── proposal + design + tasks + spec delta
        │
/opsx:apply  (TDD, reglas §3)     ── implementar
        │
/ponytail-audit · /code-review    ── loops de mejora
        │
/opsx:verify  (puertas §4)        ── validar
        │
/opsx:archive                     ── fusionar spec + actualizar CONTEXT.md
```
