# CLAUDE.md

Guía para Claude Code en este repositorio. Mantenela corta: cada línea debe cambiar cómo trabaja Claude. El detalle vive en `docs/` y en `api/CLAUDE.md` (se carga solo al trabajar en `api/`).

## Proyecto

"Mis Gastos": gestor de gastos personales. Frontend React 19 + TypeScript + Vite 8 (sin librerías de UI ni de gráficos) en `src/`. Backend opcional ASP.NET Core 10 + EF Core/SQLite en `api/` (ver `api/CLAUDE.md`). Los datos viven en `localStorage` por defecto, o en la API si `.env.local` define `VITE_DATA_SOURCE=api`.

- **Idioma:** textos de UI, comentarios, nombres de pruebas, commits y docs en **español**. Identificadores de código, comandos y rutas en inglés.
- Requiere Node 20.19+ (`.nvmrc`) y .NET 10 SDK.

## Comandos

```bash
npm run dev                          # Vite en http://localhost:5173
npm run check                        # lint + pruebas + build: el gate de CI
npm test                             # vitest run (npm run test:watch para modo watch)
npm run build                        # tsc -b && vite build
npm run lint                         # oxlint (.oxlintrc.json)
npx vitest run src/__tests__/stats.test.ts   # un archivo
npx vitest run -t "elimina un gasto"         # una prueba por nombre
npm run test:e2e                     # E2E de UI con Playwright (e2e/, Vite propio en :5174 con localStorage)
```

Pruebas en `src/__tests__/`, espejadas por capa (`domain/`, `application/`, `infrastructure/`, `presentation/`), en entorno `node` (sin DOM ni React Testing Library). Están **excluidas** de `tsconfig.app.json`: `npm run build` no las type-checkea. Usá `fakeServices()` de `__tests__/fakes.ts` (ids y reloj deterministas), `cats`/`exp()` de `fixtures.ts`, y los correos de ejemplo de `__tests__/samples/`.

Frontend contra el backend: `Copy-Item .env.example .env.local`, levantar la API (ver `api/CLAUDE.md`) y `npm run dev`. Borrar `.env.local` vuelve a `localStorage`.

## Entorno (Windows)

- Shell principal: **PowerShell**. Rutas con `\` en comandos de Windows; en el código, `/`.
- Puertos: frontend `5173`, API `5080`.
- **IMPORTANT:** antes de `dotnet test` o `dotnet build`, verificá que `Gastos.Api` no esté corriendo. Si lo está, Windows bloquea sus DLL y `Gastos.IntegrationTests` no compila (`MSB3021` / "file is locked by Gastos.Api"). Pedime que la detenga; no la mates sin avisar.
- `api\run-tests.ps1` corre todas las pruebas del backend y guarda `TestResults\tests-<fecha>.log` + `.trx` para analizarlos.

## Arquitectura

Clean Architecture en cuatro capas (diagrama y ADR-009 en `docs/ARQUITECTURA.md`). Imports permitidos, **verificados por `src/__tests__/architecture.test.ts`**:

| Capa | Puede importar de |
|---|---|
| `domain/` | solo `domain`: sin React, sin I/O |
| `application/` | `domain`: sin React |
| `infrastructure/` | `domain`, `application` |
| `presentation/` | `domain`, `application` (nunca `infrastructure`) |
| `main.tsx` | cualquiera: es el composition root |

Los imports entre capas pasan por los barrels `domain/index.ts` y `application/index.ts`; agregá ahí los exports nuevos. Archivos en camelCase (`httpGateway.ts`), aunque exporten clases (`HttpGateway`).

- **`domain/`**: `entities/` (tipos; `PAYMENT_METHODS` es solo una tupla de valores, las etiquetas de UI viven en `presentation/labels.ts`; `defaultCategories.ts`), `rules/` (`validateX` devuelve un mapa `ValidationErrors<T>`; `normalizeX` da la forma canónica persistida; `countExpensesInCategory` para ADR-008; `merchantCategory`), `services/stats.ts` (agregaciones del dashboard) y `services/insights.ts` (análisis del mes: fijos vs variables, proyección, insights; ADR-013), `shared/` (fechas, `roundMoney`, `hasErrors`).
- **`application/`**: `ports/` define `StoreGateway` (async `load()` / `persist(action, next)`), `IdGenerator`, `Clock`, `BankNotificationReader` y `AppDependencies`. `useCases/` son **funciones puras** `(state, …args, services) → Decision`, donde `Decision` es `{ ok: false, errors }` o `{ ok: true, action }` con la entidad completa (id, timestamps, campos normalizados). `state/storeReducer.ts` solo aplica acciones: no valida ni genera ids/fechas.
- **`infrastructure/`**: `container.ts` `createDependencies({ dataSource, apiUrl, storage })` elige el gateway: `http/httpGateway.ts` (cada `StoreAction` → llamada REST; lanza `ApiError` con el mensaje de Problem Details) si `dataSource === 'api'`, si no `storage/localStorageGateway.ts` sobre `localStorageRepository.ts` (claves versionadas `gastos:v1:categories` / `gastos:v1:expenses`, semilla en `storage/seed.ts`). `browserStorage()` cae a `MemoryStorage`. `email/` implementa la lectura de correos bancarios.
- **`presentation/`**: `hooks/useExpenseStore(deps)` es un adaptador React delgado: carga con `gateway.load()` (expone `status: 'loading' | 'ready' | 'error'`), corre un caso de uso, despacha la acción si `ok` y llama `gateway.persist()` en forma optimista; si falla, setea `syncError` y recarga. `App.tsx` recibe `deps` de `main.tsx` y pasa datos/comandos por props (sin Context). `format.ts` = formato de pantalla; `labels.ts` = textos en español. Lógica de formularios en hooks (`useExpenseForm`), markup compartido en componentes chicos (`Field`); reiniciar estado con `key`, nunca con un `useEffect` silenciado.
- **Administración** (`pages/AdminPage.tsx`, menú `layout/Sidebar.tsx`): importar correos bancarios, respaldo JSON y borrar todo. La importación es el caso de uso puro `importBankEmails` sobre el puerto `BankNotificationReader`, con perfiles por banco en `infrastructure/email/bankProfiles.ts`. Detalle en ADR-012 y ADR-014.

Para agregar una funcionalidad: regla en `domain/rules` → caso de uso en `application/useCases` (+ acción en `storeReducer` si es nueva) → exponerla en `useExpenseStore` → UI en `presentation/components`. Receta completa en `docs/GUIA_BUENAS_PRACTICAS.md` §6.

## Convenciones que importan

- **IMPORTANT: las fechas son strings locales `YYYY-MM-DD`** y los meses `YYYY-MM`. Nunca `new Date('YYYY-MM-DD')` (se interpreta en UTC y corre el día en UTC-6); usá `new Date(y, m - 1, d)` o los helpers de `domain/shared/dates.ts`.
- Nunca `new Date()` / `crypto.randomUUID()` dentro de `domain` o `application` para ids o timestamps: usá `Clock` / `IdGenerator` inyectados.
- Montos: `number` redondeado a 2 decimales (`roundMoney`); moneda solo CRC.
- Una categoría con gastos no se puede borrar (caso de uso `deleteCategory`, con guarda defensiva en el reducer).
- TypeScript con `erasableSyntaxOnly` y `verbatimModuleSyntax`: sin enums, sin parameter properties, sin namespaces; `import type` para imports de solo tipos.
- Gráficos a mano con barras CSS / columnas SVG; estilos en CSS plano con variables en `src/index.css`.
- Sin `any`, sin `eslint-disable`, sin `console.log` de depuración, sin números ni textos mágicos repetidos.

## Flujo de trabajo con IA

La IA propone, el desarrollador decide (`docs/MEJORES_PRACTICAS_PROMPTS.md`).

- Para cambios de más de un archivo, **presentá un plan y esperá aprobación** antes de editar.
- **IMPORTANT:** nunca modifiques, saltes ni borres una prueba para que pase. Si una prueba parece incorrecta, explicá por qué y preguntá.
- Antes de dar algo por terminado, corré los quality gates y reportá el resultado real (no lo supongas).
- Si cambia una decisión de arquitectura, actualizá o agregá el ADR en `docs/ARQUITECTURA.md`.
- Al cerrar una actividad relevante, proponé la entrada para `docs/BITACORA_PROMPTS.md` (comando `/bitacora`).
- **IMPORTANT:** no hagas `git commit` ni `git push` sin que te lo pida. No agregues dependencias nuevas sin justificar necesidad, licencia y mantenimiento.

## Commits

Conventional Commits en español, en imperativo/sustantivo, con scope cuando aplica: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`; scopes usados: `front`, `api`, `ui`, `core`, `import`, `dashboard`. Referenciá el ADR si aplica.

- `feat(import): leer correos de cualquier banco o comercio con perfiles (ADR-014)`
- `fix(api): validar largo de ids y pruebas de arquitectura .NET`

## Seguridad

- **IMPORTANT:** no leas, muestres ni subas `.env.local` ni otros `*.local`; usá `.env.example` como referencia.
- Los correos bancarios reales (`../correos/`, archivos `.eml` fuera del repo) contienen datos personales: no los leas ni los copies al repo. Para pruebas usá `src/__tests__/samples/` o datos inventados.
- No subas bases SQLite (`*.db`), `TestResults/` ni logs: ya están en `.gitignore`.
- Nunca pongas secretos, tokens ni datos de clientes de Babel en código, pruebas, commits o docs.

## Quality gates

`npm run check` y `dotnet test api` deben pasar; ambos corren en `.github/workflows/ci.yml`. Checklist completo antes de commit en `docs/GUIA_BUENAS_PRACTICAS.md` §7.

## Docs

- `docs/ARQUITECTURA.md`: diagramas, modelo de datos, ADR-001…014, roadmap.
- `docs/GUIA_BUENAS_PRACTICAS.md`: dónde va cada cosa, patrones, convenciones, checklist. Seguila.
- `docs/MEJORES_PRACTICAS_PROMPTS.md`: cómo usar la IA en este proyecto.
- `docs/CODE_REVIEW.md`: hallazgos de revisiones anteriores.
- `docs/BITACORA_PROMPTS.md`: registro de actividades con IA del "Objetivo Babel 2026".
- `api/README.md` y `api/CLAUDE.md`: backend.
