# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Mis Gastos" — a frontend-only personal expense tracker (React 19 + TypeScript + Vite 8, no backend, no UI/chart libraries). Data lives in `localStorage`. UI text, code comments, test names and docs are in **Spanish**; keep new code consistent with that.

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

Tests live only in `src/__tests__/*.test.ts`, run in the `node` environment (no DOM, no React Testing Library), and are **excluded** from `tsconfig.app.json` — so `npm run build` does not type-check test files.

## Architecture

Dependency rule (see `docs/ARQUITECTURA.md`, which also holds the ADRs): `components → hooks → domain`, and `hooks → data`. `domain/` must stay free of React and storage so it can be unit-tested as pure functions.

- **`src/domain/`** — pure logic: types, `validation.ts` (returns `ValidationErrors<T>` maps), `stats.ts` (dashboard aggregations), `dates.ts`, `format.ts` (`roundMoney`, CRC formatting via `Intl.NumberFormat('es-CR')`).
- **`src/data/`** — persistence behind `Repository<T>` (`getAll`/`saveAll`). `createRepositories(storage?)` in `data/index.ts` wires `LocalStorageRepository` instances to the versioned keys `gastos:v1:categories` / `gastos:v1:expenses`; categories fall back to `seed.ts` defaults when the key is empty. `browserStorage()` falls back to `MemoryStorage` if `localStorage` is unavailable; tests inject `MemoryStorage` directly. A future `HttpRepository` is meant to replace this without touching components.
- **`src/hooks/useExpenseStore.ts`** — the single app store. Flow for every mutation: validate with `domain/validation` → return `{ ok: false, errors }` on failure, otherwise dispatch to the pure `expenseReducer`. IDs and timestamps (`newId()`, `new Date().toISOString()`) are generated in the hook and passed **in** the action so the reducer stays deterministic. Persistence is two `useEffect`s that call `saveAll` whenever each collection changes. Components consume the returned object (typed `ExpenseStore`) via props from `App.tsx`; there is no Context.
- **`src/hooks/expenseReducer.ts`** — pure reducer with namespaced actions (`expense/add`, `category/delete`, `store/replace`, …); normalizes input (rounds amount to 2 decimals, trims text, lowercases colors).
- **`src/hooks/backup.ts`** — `parseBackup` validates imported JSON (shape + referential integrity of `categoryId`) before `store/replace`.
- **`src/App.tsx`** — shell with tab navigation (dashboard / gastos / categorías), owns UI state for filters and the expense currently being edited.

## Conventions that matter

- **Dates are local `YYYY-MM-DD` strings**, months are `YYYY-MM`. Never use `new Date('YYYY-MM-DD')` (parses as UTC and shifts the day in UTC-6); build dates with `new Date(y, m - 1, d)` or use helpers in `domain/dates.ts` (`todayISO`, `currentMonth`, `lastMonths`, …).
- Amounts are `number` rounded to 2 decimals (`roundMoney`); currency is CRC only.
- A category with expenses cannot be deleted (enforced in `useExpenseStore.deleteCategory` via `categoryInUse`).
- TypeScript uses `erasableSyntaxOnly` and `verbatimModuleSyntax`: no enums/parameter properties/namespaces, and use `import type` for type-only imports.
- Charts are hand-rolled CSS bars / SVG columns; styling is plain CSS with variables in `src/index.css`.

## Docs

`docs/ARQUITECTURA.md` (diagrams, data model, ADR-001…008, roadmap), `docs/CODE_REVIEW.md`, `docs/BITACORA_PROMPTS.md` (log of AI-assisted activities for the "Objetivo Babel 2026" goal). Update the ADRs when making an architectural change.
