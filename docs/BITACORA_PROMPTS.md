# Bitácora de uso de Claude en el ciclo de desarrollo

> KR3 · Aplicar Claude en al menos 10 actividades distintas del ciclo de desarrollo.
> Herramienta: Claude (Claude Code / Cowork) · Proyecto: Mis Gastos (React + TypeScript)
> Fecha de ejecución principal: 27-sep-2026

**Principio aplicado:** la IA propone, yo valido. Cada resultado se verificó con compilación estricta, pruebas automatizadas, linter o revisión manual antes de aceptarlo.

## Resumen

| # | Actividad del ciclo | Evidencia | Validación |
|---|---------------------|-----------|------------|
| 1 | Definición de alcance y decisiones de stack | Sección 1-2 de `ARQUITECTURA.md` | Decisión propia entre 3 opciones propuestas |
| 2 | Definición de arquitectura | `ARQUITECTURA.md` §3, §6 | Regla de dependencias revisada |
| 3 | Modelo de datos | `ARQUITECTURA.md` §4 (ERD) | Revisión de campos y restricciones |
| 4 | Decisiones técnicas (ADRs) | `ARQUITECTURA.md` §5 (8 ADRs) | Contrastadas con experiencia en .NET |
| 5 | Diseño de componentes | `src/components/*` | Props tipadas, `tsc` estricto |
| 6 | Diseño de la capa de datos / "API" interna | `src/data/repository.ts` | Pruebas de repositorio |
| 7 | Implementación de lógica de dominio | `src/domain/*` | 38 pruebas unitarias |
| 8 | Generación de pruebas | `src/__tests__/*` | `npm test` 38/38 |
| 9 | Detección de errores | Commits `fix:` y CODE_REVIEW #4, #5 | Build + tests |
| 10 | Revisión de código | `CODE_REVIEW.md` | Hallazgos aceptados / descartados con criterio |
| 11 | Refactorización | `useRef` → `useState` en el store | Linter 0 warnings |
| 12 | Pruebas E2E / QA | Script Playwright + capturas `docs/img` | Flujo completo sin errores de consola |
| 13 | Documentación técnica | `README.md`, este documento | Revisión de lectura |
| 14 | Elaboración de roadmap | `ARQUITECTURA.md` §7 | Alineado con stack .NET/Azure |
| 15 | Contexto del repositorio con `/init` (Claude Code en VS Code) | `CLAUDE.md` | Revisado y aprobado manualmente |
| 16 | Diagnóstico de entorno (Node 18 vs Vite 8, credenciales Git) | Commit `chore: requerir Node 20.19+` | App ejecutando en Node 22 |
| 17 | Documentación de mejores prácticas de prompts | `MEJORES_PRACTICAS_PROMPTS.md` | Revisión propia |
| 18 | Refactor a Clean Architecture con Claude Code en VS Code | Commit `main update structure`, ADR-009, `architecture.test.ts` | 60 pruebas, build y lint en verde |
| 19 | Revisión de estructura, patrones y mantenibilidad | `GUIA_BUENAS_PRACTICAS.md`, ADR-010, `CODE_REVIEW.md` #9–15 | 62 pruebas + E2E |
| 20 | Backend .NET 10 y conexión del frontend (prueba de datos) | `api/`, ADR-011, `HttpGateway` | 28 pruebas unitarias C#, 77 Vitest, E2E React ↔ API |

---

## Detalle

### 1. Alcance y stack
- **Prompt:** "Vamos, ayudame, vamos a sacar esto hoy" + capturas del objetivo en Workday (Goal y Milestones).
- **Resultado:** Claude leyó los 4 KRs, propuso 3 alternativas (React + localStorage, React + API .NET + SQLite, reutilizar un proyecto existente) con trade-offs de tiempo y riesgo.
- **Decisión:** Vite + React + TS con localStorage detrás de un Repository, para poder migrar a API después.
- **Aprendizaje:** Pedir opciones con trade-offs en lugar de una sola respuesta evita que la IA decida por uno.

### 2. Arquitectura
- **Prompt:** "Diseñá la arquitectura del módulo con capas separadas; que el dominio no dependa de React."
- **Resultado:** Capas `domain / data / hooks / components` con regla de dependencias estilo Clean Architecture y diagrama Mermaid.
- **Aprendizaje:** Los mismos principios que uso en .NET (Clean Architecture, Repository) se trasladan bien al frontend.

### 3. Modelo de datos
- **Prompt:** "Definí el modelo de datos de Expense y Category con restricciones."
- **Resultado:** ERD con tipos, longitudes, FK y claves versionadas de almacenamiento (`gastos:v1:*`).
- **Aprendizaje:** Versionar las claves desde el día 1 facilita migraciones.

### 4. ADRs
- **Prompt:** "Documentá las decisiones técnicas como ADRs con contexto, decisión y consecuencias."
- **Resultado:** 8 ADRs. Destaca ADR-005 (fechas `YYYY-MM-DD` para evitar el desfase UTC-6 de Costa Rica).
- **Aprendizaje:** La IA anticipó un bug real de zonas horarias antes de escribir código.

### 5. Diseño de componentes
- **Prompt:** "Diseñá los componentes: formulario, lista con filtros, gestor de categorías y dashboard; componentes delgados, lógica en dominio."
- **Resultado:** 6 componentes con props tipadas; sin librería de UI ni de gráficos (ADR-007).

### 6. Diseño de la capa de datos
- **Prompt:** "Creá una interfaz Repository<T> y una implementación sobre localStorage que tolere datos corruptos."
- **Resultado:** `Repository<T>`, `LocalStorageRepository`, `MemoryStorage` para pruebas y fallback en modo privado.
- **Aprendizaje:** Inyectar el storage hace la capa testeable sin DOM.

### 7. Lógica de dominio
- **Prompt:** "Implementá validación, totales por categoría, tendencia de 6 meses y resumen mensual como funciones puras."
- **Resultado:** `validation.ts`, `stats.ts`, `dates.ts`, `format.ts`.

### 8. Generación de pruebas
- **Prompt:** "Generá pruebas Vitest para dominio, reducer, repositorio y respaldo, incluyendo casos borde."
- **Resultado:** 38 pruebas: 29-feb bisiesto, 30-feb inválido, `0.1+0.2`, cambio de año, JSON corrupto, categorías huérfanas en respaldo.
- **Resultado de ejecución:** 38/38 al primer intento.

### 9. Detección de errores
- **Hallazgo:** `tsc -b` falló por un `satisfies StoreState & object` incompatible con los campos extra del respaldo. Claude diagnosticó y corrigió.
- **Hallazgo:** Selector ambiguo en la prueba E2E (`text=Gastos` coincidía con el título "Mis Gastos"); corregido a `role=tab`.

### 10. Revisión de código
- **Prompt:** "Revisá el código como un senior: bugs, anti-patrones de React, UX."
- **Resultado:** 8 hallazgos en `CODE_REVIEW.md`, 7 aplicados y 1 descartado con justificación.

### 11. Refactorización
- **Antes:** `useRef().current` leído en el inicializador de `useReducer` (advertencia React Compiler).
- **Después:** `useState(() => createRepositories())` + `useReducer(reducer, repos, init)`. Linter en 0.

### 12. QA / pruebas E2E
- **Prompt:** "Probá la app en un navegador real: alta, edición, borrado, recarga, reglas de categorías y móvil."
- **Resultado:** Script Playwright; se detectó el título "Resumen De Septiembre De 2026" mal capitalizado → corregido y cubierto con prueba.

### 13. Documentación
- README con ejecución, estructura, tabla de evidencias por KR y capturas.

### 14. Roadmap
- Fase 2: API ASP.NET Core 8 (CQRS/MediatR), `HttpRepository`, Entra ID, presupuestos, importación desde correos bancarios, Azure Static Web Apps.

### 15. `/init` en Claude Code
- **Comando:** `claude` → `/init` en la terminal de VS Code.
- **Resultado:** `CLAUDE.md` con comandos, arquitectura, regla de dependencias y convenciones (fechas locales, `erasableSyntaxOnly`, idioma español).
- **Aprendizaje:** los comandos `/…` se ejecutan dentro de la sesión de `claude`, no en PowerShell.

### 16. Diagnóstico de entorno
- **Prompt:** pegar el error completo de `npm run dev` (`styleText` no exportado por `node:util`).
- **Resultado:** causa raíz identificada (Node 18.15 < 20.19 que requiere Vite 8); solución con nvm-windows y `engines` + `.nvmrc`. También se resolvió un 403 de GitHub por credenciales de otra cuenta, poniendo el usuario en la URL del remoto.

### 17. Mejores prácticas de prompts
- Documento `MEJORES_PRACTICAS_PROMPTS.md` con anatomía del prompt, plantillas, comandos y lecciones.

### 18. Refactor a Clean Architecture (Claude Code en consola)
- **Herramienta:** Claude Code dentro de VS Code.
- **Resultado:** capas `domain / application / infrastructure / presentation`, casos de uso puros que devuelven una `Decision`, puertos `Repository`, `Clock` e `IdGenerator`, composition root en `main.tsx`, y una prueba automática de la regla de dependencias.
- **Validación:** 60 pruebas, build y lint en verde; ADR-009 documentado.

### 19. Revisión de estructura y buenas prácticas
- **Prompt:** "Revisar las mejores prácticas de la estructura del proyecto, que tenga un patrón de diseño con buenas prácticas y código legible y mantenible, documentar en español."
- **Resultado:** 7 hallazgos (6 aplicados, 1 diferido como deuda técnica) y guía `GUIA_BUENAS_PRACTICAS.md`, que incluye catálogo de patrones con su equivalente en .NET, convenciones, receta para agregar funcionalidades, checklist y deuda técnica.
- **Aprendizaje:** una buena arquitectura igual necesita convenciones escritas; si no, se degrada con cada cambio.

### 20. Backend .NET 10 para prueba de datos
- **Prompt:** "Hagamos el back en .NET también, ¿podemos? Para hacer una prueba de datos."
- **Decisiones (tomadas por mí entre opciones propuestas):** SQLite, API + conectar el front, CQRS con handlers propios en lugar de MediatR (licencia comercial desde la v13) y .NET 10.
- **Resultado:**
  - API REST con Clean Architecture en 4 proyectos, patrón Result → Problem Details, EF Core + SQLite con 6 meses de datos de ejemplo y archivo `.http` para pruebas manuales.
  - En el frontend, el puerto `StoreGateway` asíncrono con adaptadores localStorage y HTTP, guardado optimista y manejo de errores de conexión.
- **Validación:**
  - Dominio y aplicación compilados; 28 pruebas unitarias ejecutadas.
  - Endpoints probados con curl: validaciones 400 por campo, 404, 409 (ADR-008) y CORS.
  - E2E del frontend contra la API: alta, edición, borrado, categoría nueva y recarga; también el mensaje con la API apagada.
- **Hallazgos corregidos durante la prueba:**
  - La API devolvía solo el primer error de validación; ahora devuelve todos juntos.
  - Un `paymentMethod` inválido producía 500 en Development; ahora devuelve 400 (`ThrowOnBadRequest = false`).
- **Aprendizaje:** el puerto síncrono era deuda técnica real. Diseñarlo en función de las **acciones** del store (`persist(action)`) permitió mapear cada cambio a un endpoint REST sin tocar dominio ni componentes.

---

## Aprendizajes generales

1. **Contexto primero:** compartir el objetivo real (capturas de Workday) produjo un plan alineado a los KRs, no solo código.
2. **Verificación automática como red de seguridad:** TypeScript estricto + Vitest + linter atraparon los errores de la IA en segundos.
3. **La IA acelera, pero las decisiones son mías:** stack, alcance y qué hallazgos de review aceptar.
4. **Commits por hito** dejan trazabilidad clara de qué produjo cada actividad.
5. **Riesgo observado:** la IA puede sobre-diseñar (p. ej. sugerir virtualización). Hay que filtrar por el contexto real.
