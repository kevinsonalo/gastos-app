# Code Review asistido por IA — MVP Gastos

> Revisión realizada con Claude sobre el commit `feat(ui)` + `feat(core)`. Cada hallazgo fue **validado manualmente** antes de aplicar o descartar el cambio.

| # | Severidad | Archivo | Hallazgo | Acción |
|---|-----------|---------|----------|--------|
| 1 | Media | `hooks/useExpenseStore.ts` | Se leía `useRef().current` dentro del inicializador de `useReducer` durante el render. El linter (regla `react(refs)`) advierte que React Compiler no puede optimizar el hook y que leer refs en render es un anti-patrón. | ✅ Reemplazado por `useState(() => createRepositories())` (instancia estable) y `useReducer(reducer, repos, init)`. |
| 2 | Baja | `components/ExpenseForm.tsx` | `setTimeout(() => setSaved(false))` sin limpieza: si el usuario cambia de pestaña antes de 1.5 s, se intenta actualizar un componente desmontado. | ✅ Movido a un `useEffect` con `clearTimeout` en el cleanup. |
| 3 | Baja (UX) | `components/Dashboard.tsx` / CSS | `text-transform: capitalize` producía "Resumen De Septiembre De 2026". | ✅ Capitalización solo de la primera letra en `monthLabel()` + prueba unitaria. |
| 4 | Media | `hooks/useExpenseStore.ts` | Tipo `satisfies StoreState & object` rompía la compilación al agregar `version`/`exportedAt` al respaldo. | ✅ Detectado por `tsc -b`; se eliminó el `satisfies` innecesario. |
| 5 | Info | `domain/dates.ts` | `new Date('YYYY-MM-DD')` se interpreta en UTC y en Costa Rica (UTC-6) muestra el día anterior. | ✅ Prevenido desde el diseño (ADR-005): fechas como string y construcción con `new Date(y, m-1, d)`. Cubierto por pruebas. |
| 6 | Info | `domain/stats.ts` | Suma de decimales (`0.1 + 0.2`). | ✅ `roundMoney()` en totales; prueba dedicada. |
| 7 | Info | `data/localStorageRepository.ts` | JSON corrupto o `localStorage` bloqueado (modo privado) rompería la app al iniciar. | ✅ `try/catch` con fallback + `MemoryStorage`; prueba dedicada. |
| 8 | Descartado | `ExpenseList.tsx` | Sugerencia: virtualizar la lista. | ❌ Innecesario para volúmenes de uso personal (< miles de registros). Se reevalúa en fase 2. |

## Verificación

- `npm test` → **38/38** pruebas pasando.
- `npm run build` (tsc estricto + Vite) → sin errores.
- `npx oxlint src` → **0 warnings, 0 errores**.
- Prueba de humo E2E (Playwright, script ad-hoc): alta con validación, edición, eliminación, persistencia tras recargar, bloqueo de eliminación de categoría en uso, nombre duplicado, layout móvil sin scroll horizontal, 0 errores de consola.
