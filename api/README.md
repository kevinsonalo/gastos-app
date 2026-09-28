# API de Mis Gastos (.NET 10)

Backend REST de *Mis Gastos*: **ASP.NET Core 10 (Minimal APIs)**, **Clean Architecture**, **CQRS con handlers propios**, **EF Core + SQLite**.
Implementa las mismas reglas de negocio que el frontend y le sirve de persistencia real (ADR-011).

## Ejecutar

```powershell
cd api
dotnet run --project src/Gastos.Api          # http://localhost:5080
dotnet test                                  # pruebas unitarias + integración
```

- En **Development** se crea `gastos.db` con las 8 categorías por defecto y **6 meses de gastos de ejemplo** (unos 70 registros) para probar el dashboard.
- Para empezar de cero: detené la API y borrá `src/Gastos.Api/gastos.db`.
- Probar los endpoints a mano: abrí `src/Gastos.Api/Gastos.Api.http` (Visual Studio, Rider, o VS Code con la extensión *REST Client*).
- Especificación OpenAPI: http://localhost:5080/openapi/v1.json

## Conectar el frontend

En la raíz del proyecto React, creá `.env.local`:

```
VITE_DATA_SOURCE=api
VITE_API_URL=http://localhost:5080
```

y corré `npm run dev`. Sin ese archivo, la app sigue usando `localStorage`.

## Estructura

```
api/
├── Gastos.slnx
├── Directory.Build.props             # net10.0, nullable, warnings como errores
├── src/
│   ├── Gastos.Domain/                # Entidades y reglas. Sin dependencias.
│   │   ├── Common/                   # Result<T>, Error (errores como valores)
│   │   ├── Categories/               # Category, CategoryRules
│   │   └── Expenses/                 # Expense, ExpenseRules, PaymentMethod
│   ├── Gastos.Application/           # Casos de uso. Solo depende de Domain.
│   │   ├── Abstractions/             # ICommand/IQuery + handlers, puertos (repos, IUnitOfWork, IClock)
│   │   ├── Categories/  Expenses/    # Un archivo por caso de uso: Command/Query + Handler
│   │   ├── Stats/                    # Resumen mensual
│   │   └── Import/                   # Importar respaldo JSON del frontend
│   ├── Gastos.Infrastructure/        # EF Core + SQLite, repositorios, seed, reloj
│   └── Gastos.Api/                   # Minimal APIs, CORS, Problem Details, composition root
└── tests/
    ├── Gastos.UnitTests/             # Dominio y handlers con repositorios en memoria
    └── Gastos.IntegrationTests/      # API completa con WebApplicationFactory + SQLite temporal
```

Regla de dependencias: `Api → Application/Infrastructure → Domain`. **Application no conoce EF Core ni ASP.NET.**

## Endpoints

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | `/health` | Estado de la API | 200 |
| GET | `/api/categories` | Lista de categorías | 200 |
| POST | `/api/categories` | Crear (`id` opcional) | 201 · 400 · 409 |
| PUT | `/api/categories/{id}` | Renombrar / cambiar color | 200 · 400 · 404 |
| DELETE | `/api/categories/{id}` | Eliminar (bloqueado si tiene gastos, ADR-008) | 204 · 404 · 409 |
| GET | `/api/expenses?month=YYYY-MM&categoryId=&search=` | Lista filtrada, orden fecha desc. | 200 · 400 |
| POST | `/api/expenses` | Crear (`id` opcional) | 201 · 400 · 409 |
| PUT | `/api/expenses/{id}` | Editar | 200 · 400 · 404 |
| DELETE | `/api/expenses/{id}` | Eliminar | 204 · 404 |
| GET | `/api/stats/monthly?month=YYYY-MM` | Total, promedio diario y totales por categoría | 200 · 400 |
| POST | `/api/import` | Reemplaza todo con un respaldo JSON del frontend | 204 · 400 |

Los errores siguen **RFC 9457 (Problem Details)**. Las validaciones devuelven los mensajes por campo con las mismas claves que el formulario (`amount`, `description`, `categoryId`…):

```json
{ "status": 400, "title": "Hay datos inválidos.",
  "errors": { "amount": ["El monto debe ser mayor a 0."], "categoryId": ["Seleccioná una categoría válida."] } }
```

## Patrones

| Patrón | Dónde |
|--------|-------|
| Clean Architecture | 4 proyectos con dependencias hacia `Domain` |
| CQRS | `ICommand<T>` / `IQuery<T>` + un handler por caso de uso (sin MediatR, ver ADR-011) |
| Result pattern | `Result<T>` + `Error` en vez de excepciones para errores de negocio |
| Repository + Unit of Work | `ICategoryRepository`, `IExpenseRepository`, `IUnitOfWork` |
| Entidades con invariantes | `Expense.Create/Update` validan; setters privados |
| Registro automático de handlers | `Api/Composition/ApplicationRegistration.cs` (reflexión) |
| Reloj e ids inyectables | `IClock`, `IIdGenerator` → pruebas deterministas |
