# Guía de estructura, patrones y buenas prácticas

> Cómo está organizado *Mis Gastos*, qué patrones de diseño usa y qué reglas seguir para que el código siga siendo legible y mantenible.
> Complementa [ARQUITECTURA.md](ARQUITECTURA.md) (el *qué* y el *por qué*); esta guía cubre el *cómo trabajar*.

---

## 1. Resumen en 30 segundos

- **Cuatro capas**: `domain` → `application` → `infrastructure` / `presentation`. Las dependencias siempre apuntan hacia el dominio.
- **El dominio es TypeScript puro**: no usa React, ni `localStorage`, ni `Date.now()`, ni `crypto`.
- **Los casos de uso son funciones puras**: reciben estado + input + servicios y devuelven una *decisión* (error o acción).
- **React solo presenta**: los componentes muestran datos y llaman comandos; las reglas de negocio no viven ahí.
- **Una prueba automática** (`architecture.test.ts`) impide romper la regla de dependencias.

---

## 2. Estructura de carpetas

```
src/
├── domain/                     # Núcleo: reglas de negocio puras
│   ├── entities/               # Tipos: Expense, Category, PaymentMethod
│   ├── rules/                  # validateX / normalizeX / reglas (ADR-008)
│   ├── services/               # Cálculos y consultas: filtros, totales, resumen mensual
│   ├── shared/                 # Utilidades de dominio: fechas, dinero, validación
│   └── index.ts                # API pública de la capa (barrel)
├── application/                # Orquestación de casos de uso
│   ├── ports/                  # Interfaces hacia el exterior: Repository, IdGenerator, Clock
│   ├── state/                  # StoreState, StoreAction, storeReducer
│   ├── useCases/               # addExpense, deleteCategory, importBackup…
│   ├── result.ts               # Result / Decision / fail / accept
│   └── index.ts
├── infrastructure/             # Implementaciones concretas de los puertos
│   ├── storage/                # LocalStorageRepository, KeyValueStorage, seed
│   ├── system/                 # cryptoIdGenerator, systemClock
│   └── container.ts            # createDependencies(): arma todo
├── presentation/               # React
│   ├── components/             # Componentes de UI (Field, ExpenseForm, Dashboard…)
│   ├── hooks/                  # useExpenseStore (adaptador), useExpenseForm (lógica de formulario)
│   ├── format.ts               # Moneda y fechas para mostrar (es-CR)
│   ├── labels.ts               # Textos de UI para valores del dominio
│   └── App.tsx
├── __tests__/                  # Espejo por capa + architecture.test.ts
└── main.tsx                    # Composition root
```

### ¿Dónde va cada cosa?

| Si estás escribiendo… | Va en | Ejemplo |
|-----------------------|-------|---------|
| Un tipo o entidad del negocio | `domain/entities` | `Expense`, `PaymentMethod` |
| Una regla que dice si algo es válido | `domain/rules` | `validateExpense`, `countExpensesInCategory` |
| Un cálculo sobre datos | `domain/services` | `monthSummary`, `totalsByCategory` |
| Una operación que el usuario ejecuta | `application/useCases` | `addExpense`, `importBackup` |
| Algo que habla con el navegador, la red o el reloj | `infrastructure` | `LocalStorageRepository`, `systemClock` |
| La interfaz que la infraestructura debe cumplir | `application/ports` | `Repository<T>`, `Clock` |
| Cómo se ve algo en pantalla | `presentation/components` | `Dashboard`, `Field` |
| Estado o lógica solo de UI | `presentation/hooks` | `useExpenseForm` |
| Texto visible para el usuario | `presentation/labels.ts` / JSX | `'SINPE Móvil'` |
| Formato de número o fecha para mostrar | `presentation/format.ts` | `formatCurrency` |

---

## 3. Patrones de diseño aplicados

| Patrón | Dónde | Para qué sirve | Equivalente en .NET |
|--------|-------|----------------|---------------------|
| **Clean Architecture / Hexagonal (Ports & Adapters)** | Toda la estructura | Aislar el negocio de la tecnología (React, `localStorage`) | Proyectos Domain / Application / Infrastructure / Web |
| **Repository** | `ports/repository.ts` + `LocalStorageRepository` | Cambiar la persistencia sin tocar el negocio (ADR-002) | `IRepository<T>` + EF Core |
| **Inyección de dependencias + Composition Root** | `container.ts` → `main.tsx` → `<App deps>` | Un único lugar crea las implementaciones concretas | `Program.cs` con `builder.Services.Add…` |
| **Caso de uso / Command** | `application/useCases/*` | Una función por operación del usuario | Handler de MediatR (`IRequestHandler`) |
| **Núcleo funcional, cáscara imperativa** | Caso de uso devuelve `Decision`; el hook ejecuta | La lógica es pura y testeable; los efectos quedan en el borde | Handler puro + `SaveChanges` en el pipeline |
| **Result / Decision** (en vez de excepciones) | `application/result.ts` | Los errores de validación son valores tipados, no `throw` | `Result<T>` / FluentValidation |
| **Reducer (máquina de estados)** | `storeReducer` | Transiciones de estado predecibles y probables | Agregado que aplica eventos |
| **Adapter** | `useExpenseStore`, `KeyValueStorage` | Conectar el núcleo con React y con la Web Storage API | Adaptadores de infraestructura |
| **Fallback / Null Object** | `MemoryStorage` si `localStorage` falla | La app no se cae en modo privado | Implementación "en memoria" |
| **Custom Hook (separar lógica de vista)** | `useExpenseForm` | El JSX queda declarativo y la lógica se reutiliza | ViewModel (MVVM) |
| **Componente de composición** | `Field` | Eliminar marcado repetido (label + control + error) | Partial view / Tag helper |
| **Servicios inyectables para el tiempo y los IDs** | `Clock`, `IdGenerator` | Pruebas deterministas sin mocks globales | `TimeProvider`, `IGuidGenerator` |

### Flujo de un comando (ejemplo: agregar gasto)

```
ExpenseForm ──submit──► useExpenseForm.handleSubmit
                              │ toExpenseInput(values)
                              ▼
                     store.addExpense(input)           (presentation/hooks/useExpenseStore)
                              │
                              ▼
          addExpense(state, input, { ids, clock })     (application/useCases — PURO)
             ├─ validateExpense()  ✗ → fail(errors) ──► el formulario muestra errores
             └─ normalizeExpense() ✓ → accept({ type: 'expense/add', expense })
                              │
                              ▼
                     dispatch(action) → storeReducer   (PURO)
                              │
                              ▼
               useEffect → repositories.expenses.saveAll()  (infrastructure)
```

---

## 4. Convenciones de código

### 4.1 Idioma
| Elemento | Idioma | Ejemplo |
|----------|--------|---------|
| Identificadores (variables, funciones, tipos, archivos) | Inglés | `addExpense`, `monthSummary` |
| Comentarios, JSDoc, mensajes al usuario, nombres de pruebas, docs | Español | `'La descripción es obligatoria.'` |

### 4.2 Nombres
- **Funciones con verbo**: `validateExpense`, `filterExpenses`, `countExpensesInCategory`.
- **Booleanos como pregunta**: `isEditing`, `hasErrors`, `isValidISODate`.
- **Constantes de configuración en MAYÚSCULAS**: `MAX_DESCRIPTION_LENGTH`, `SAVED_MESSAGE_MS`.
- **Componentes en PascalCase, un componente por archivo**: `ExpenseForm.tsx`.
- **Hooks con prefijo `use`**: `useExpenseForm`.
- **Acciones con espacio de nombres**: `'expense/add'`, `'category/delete'`.

### 4.3 Sin números ni textos mágicos
- ❌ `maxLength={120}` → ✅ `maxLength={MAX_DESCRIPTION_LENGTH}` (una sola fuente de verdad con la validación).
- ❌ `paymentMethod: 'card'` → ✅ `DEFAULT_PAYMENT_METHOD`.
- ❌ `{ month: '', categoryId: '', search: '' }` repetido → ✅ `NO_FILTERS`.

### 4.4 Funciones pequeñas y puras
- Una función hace una cosa; si necesitás "y" para describirla, dividila.
- Preferir funciones puras: mismo input produce mismo output, sin efectos.
- `Date`, `crypto`, `localStorage` y `console` solo en `infrastructure` o en el borde (`presentation`).

### 4.5 Inmutabilidad
- Nunca mutar el estado: `[...items, nuevo]`, `items.map(...)`, `{ ...obj, campo }`.
- `sortExpenses` copia antes de ordenar (`[...expenses].sort`).

### 4.6 TypeScript
- Modo estricto, sin `any`. Si un valor viene de afuera (JSON), usar `unknown` y *type guards* (`isExpense`).
- Derivar tipos de los datos: `type PaymentMethod = (typeof PAYMENT_METHODS)[number]`.
- `import type` para importar solo tipos (`verbatimModuleSyntax`).
- Sin `enum` ni *parameter properties* (`erasableSyntaxOnly`).
- `Record<PaymentMethod, string>` obliga a traducir cada valor: si se agrega un método de pago, el compilador avisa.

### 4.7 React
- Los componentes reciben datos y callbacks por *props*; no importan `infrastructure`.
- La lógica de formularios va en hooks (`useExpenseForm`) y el JSX queda declarativo.
- **Reiniciar estado con `key`**, no con `useEffect` + `eslint-disable`: `<ExpenseForm key={editing?.id ?? 'new'} />`.
- Todo efecto con timers o suscripciones devuelve su *cleanup*.
- `useMemo` solo para cálculos derivados costosos o identidades estables.
- Accesibilidad: `aria-invalid`, `aria-label` en botones de ícono, `role="status"` en avisos.

### 4.8 Imports
- Entre capas, importar desde el **barrel** (`'../../domain'`, `'../../application'`), no desde archivos internos.
- Dentro de una misma capa se permiten rutas relativas directas.

### 4.9 Comentarios
- Explicar el **por qué**, no el qué: ✅ `// No usa Math.round(value*100)/100 porque 2500.555*100 = 250055.4999…`.
- JSDoc en funciones públicas de `domain` y `application`.
- Referenciar ADRs cuando una línea aplica una decisión (`// ADR-008`).

---

## 5. Estrategia de pruebas

| Capa | Qué se prueba | Herramienta | Ejemplo |
|------|---------------|-------------|---------|
| `domain` | Reglas y cálculos, casos borde | Vitest, sin mocks | 29-feb bisiesto, `0.1 + 0.2`, cambio de año |
| `application` | Casos de uso con `fakeServices()` deterministas | Vitest | `addExpense` genera `id-1` y la fecha fija |
| `infrastructure` | Repositorio con `MemoryStorage` | Vitest | JSON corrupto → valor por defecto |
| `presentation` | Formato y etiquetas | Vitest | Cada `PaymentMethod` tiene etiqueta |
| Arquitectura | Regla de dependencias entre capas | `architecture.test.ts` | `domain` no importa React |
| E2E (manual/script) | Flujo completo en navegador | Playwright | Alta, edición, borrado, recarga |

**Regla:** toda regla de negocio nueva lleva al menos una prueba del caso normal y una del caso borde.

---

## 6. Cómo agregar una funcionalidad (receta)

Ejemplo: **presupuesto mensual por categoría**.

1. **Dominio**: agregar `monthlyBudget?: number` a `Category`, crear `domain/services/budget.ts` con `budgetUsage(expenses, category, month)` y sus pruebas.
2. **Reglas**: extender `validateCategory` (presupuesto ≥ 0) y `normalizeCategory`.
3. **Aplicación**: si es un comando nuevo, crear el caso de uso y la acción del reducer; si es solo lectura, no hace falta.
4. **Persistencia**: si cambia la forma guardada, subir la clave a `gastos:v2:*` con migración en `infrastructure`.
5. **Presentación**: componente `BudgetBar` y texto en `labels.ts` si aplica.
6. **Documentar**: nuevo ADR en `ARQUITECTURA.md` si hay decisión de diseño.
7. **Verificar**: `npm test`, `npm run build`, `npm run lint`, prueba manual.
8. **Commit** convencional: `feat(budget): …`.

---

## 7. Checklist antes de hacer commit

- [ ] `npm test` en verde (incluye la prueba de arquitectura)
- [ ] `npm run build` sin errores de tipos
- [ ] `npm run lint` con 0 warnings
- [ ] Sin `any`, sin `eslint-disable`, sin `console.log` de depuración
- [ ] Sin números ni textos mágicos repetidos
- [ ] Reglas de negocio en `domain`, no en componentes
- [ ] Pruebas para lógica nueva
- [ ] ADR o documentación actualizada si cambió una decisión
- [ ] Mensaje de commit convencional (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`)

---

## 8. Deuda técnica conocida

| # | Deuda | Impacto | Plan |
|---|-------|---------|------|
| 1 | `Repository<T>` es **síncrono** | Una API HTTP es asíncrona | Pasar a `Promise<T[]>` al introducir `HttpRepository` (fase 2) |
| 2 | Se reescribe la colección completa en cada cambio | Irrelevante para uso personal | Operaciones por entidad cuando exista API |
| 3 | `App.tsx` orquesta las 3 pestañas | Crece si se agregan vistas | Extraer `pages/` o usar un router si hay más de 3 vistas |
| 4 | Sin pruebas de componentes (DOM) | La UI se verifica con E2E manual | Agregar React Testing Library si la UI crece |
| 5 | Moneda única CRC | — | ADR nuevo si se necesita multimoneda |
