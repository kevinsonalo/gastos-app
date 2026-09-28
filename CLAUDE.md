# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Mis Gastos" — personal expense tracker. Frontend: React 19 + TypeScript + Vite 8 (no UI/chart libraries) in `src/`. Optional backend: ASP.NET Core 10 + EF Core/SQLite in `api/` (see `api/README.md`). Data lives in `localStorage` by default, or in the API when `.env.local` sets `VITE_DATA_SOURCE=api`. UI text, code comments, test names and docs are in **Spanish**; keep new code consistent with that.

Requires Node 20.19+ (see `.nvmrc`).

## Commands

```bash
npm run dev                          # Vite dev server at http://localhost:5173
npm run build                        # tsc -b && vite build (type-check + bundle to dist/)
npm run lint                         # oxlint (config: .oxlintrc.json)
npm test                             # vitest run (all tests)
npx vitest run src/__tests__/stats.test.ts   # single test file
npx vitest run -t "elimina un gasto"         # single test by name
```

Tests live in `src/__tests__/`, mirrored by layer (`domain/`, `application/`, `infrastructure/`, `presentation/`), and run in the `node` environment (no DOM, no React Testing Library). They are **excluded** from `tsconfig.app.json`, so `npm run build` does not type-check them. Use `fakeServices()` from `__tests__/fakes.ts` for deterministic ids/clock and `cats`/`exp()` from `fixtures.ts`.

## Architecture

Clean Architecture in four layers (full diagram and ADR-009 in `docs/ARQUITECTURA.md`). Allowed imports, **enforced by `src/__tests__/architecture.test.ts`**:

| Layer | May import from |
|---|---|
| `domain/` | `domain` only — no React, no I/O |
| `application/` | `domain` — no React |
| `infrastructure/` | `domain`, `application` |
| `presentation/` | `domain`, `application` (never `infrastructure`) |
| `main.tsx` | anything — it is the composition root |

Cross-layer imports go through the barrels `domain/index.ts` and `application/index.ts`; add new exports there.

- **`domain/`** — `entities/` (types; `PAYMENT_METHODS` is a value tuple only, UI labels live in `presentation/labels.ts`), `rules/` (`validateX` returns a `ValidationErrors<T>` map; `normalizeX` gives the canonical persisted shape; `countExpensesInCategory` for ADR-008), `services/stats.ts` (dashboard aggregations), `shared/` (dates, `roundMoney`, `hasErrors`).
- **`application/`** — `ports/` defines `StoreGateway` (async `load()` / `persist(action, next)`), `IdGenerator`, `Clock` and `AppDependencies`. `useCases/` are **pure functions** `(state, …args, services) → Decision`, where `Decision` is `{ ok: false, errors }` or `{ ok: true, action }` carrying a fully built entity (id, timestamps, normalized fields). `state/storeReducer.ts` only applies actions — it does not validate or generate ids/dates.
- **`infrastructure/`** — `container.ts` `createDependencies({ dataSource, apiUrl, storage })` picks the gateway: `http/HttpGateway` (maps each `StoreAction` to a REST call, throws `ApiError` with the Problem Details message) when `dataSource === 'api'`, otherwise `storage/LocalStorageGateway` over `LocalStorageRepository` (versioned keys `gastos:v1:categories` / `gastos:v1:expenses`, categories seeded from `storage/seed.ts`). `browserStorage()` falls back to `MemoryStorage`.
- **`presentation/`** — `hooks/useExpenseStore(deps)` is a thin React adapter: it loads state via `gateway.load()` (exposes `status: 'loading' | 'ready' | 'error'`), runs a use case, dispatches the action if `ok`, then calls `gateway.persist()` optimistically; on failure it sets `syncError` and reloads. `App.tsx` receives `deps` from `main.tsx` and passes store data/commands down as props (no Context). `format.ts` holds display formatting (`formatCurrency`, `formatDate`, `monthLabel`); `labels.ts` maps domain values to Spanish UI text. Form logic goes in hooks (`useExpenseForm`) and shared markup in small components (`Field`); reset component state with `key`, never with a suppressed `useEffect`.

To add a feature: rule in `domain/rules` → use case in `application/useCases` (+ action in `storeReducer` if new) → expose it in `useExpenseStore` → UI in `presentation/components`.

## Conventions that matter

- **Dates are local `YYYY-MM-DD` strings**, months are `YYYY-MM`. Never use `new Date('YYYY-MM-DD')` (parses as UTC and shifts the day in UTC-6); build dates with `new Date(y, m - 1, d)` or use helpers in `domain/shared/dates.ts`.
- Never call `new Date()` / `crypto.randomUUID()` inside `domain` or `application` for ids/timestamps — use the injected `Clock` / `IdGenerator`.
- Amounts are `number` rounded to 2 decimals (`roundMoney`); currency is CRC only.
- A category with expenses cannot be deleted (`deleteCategory` use case, with a defensive guard in the reducer).
- TypeScript uses `erasableSyntaxOnly` and `verbatimModuleSyntax`: no enums/parameter properties/namespaces, and use `import type` for type-only imports.
- Charts are hand-rolled CSS bars / SVG columns; styling is plain CSS with variables in `src/index.css`.

## Backend (`api/`)

```bash
dotnet run --project api/src/Gastos.Api   # http://localhost:5080, seeds gastos.db in Development
dotnet test api                           # xUnit unit + integration (WebApplicationFactory)
```

Clean Architecture: `Gastos.Domain` (entities with private setters, `Result<T>`/`Error`), `Gastos.Application` (one file per use case: `XCommand`/`XQuery` + handler implementing `ICommandHandler`/`IQueryHandler`; no MediatR, no DI package), `Gastos.Infrastructure` (EF Core SQLite, repositories, `DataSeeder`), `Gastos.Api` (Minimal API endpoints inject handlers directly; `ResultExtensions.ToHttpResult` maps errors to Problem Details; handlers are auto-registered by reflection in `Composition/ApplicationRegistration.cs`). Validation messages and field keys must match the frontend's (`amount`, `description`, `categoryId`, …). JSON enums are camelCase strings.

## Docs

`docs/ARQUITECTURA.md` (diagrams, data model, ADR-001…011, roadmap), `api/README.md` (backend endpoints and structure), `docs/GUIA_BUENAS_PRACTICAS.md` (where code goes, design patterns, conventions, pre-commit checklist — follow it), `docs/CODE_REVIEW.md`, `docs/BITACORA_PROMPTS.md` (log of AI-assisted activities for the "Objetivo Babel 2026" goal). Update the ADRs when making an architectural change.
