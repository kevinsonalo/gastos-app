# CLAUDE.md — Backend (`api/`)

Complementa el `CLAUDE.md` de la raíz (idioma, flujo con IA, commits y seguridad aplican igual). Detalle de endpoints en `README.md`; convenciones completas en `../docs/GUIA_BUENAS_PRACTICAS.md` §8.

## Comandos (PowerShell, desde `api/`)

```powershell
dotnet run --project src/Gastos.Api      # http://localhost:5080; en Development crea gastos.db con datos de ejemplo
dotnet test                              # unitarias + integración (Gastos.slnx)
dotnet test tests/Gastos.UnitTests       # solo unitarias
dotnet test --filter "FullyQualifiedName~ApiTests"   # filtrar
.\run-tests.ps1                          # todo + TestResults\tests-<fecha>.log y .trx
```

- **IMPORTANT:** detené `Gastos.Api` antes de compilar o probar; si está corriendo, sus DLL quedan bloqueadas y `Gastos.IntegrationTests` falla con `MSB3021`. `run-tests.ps1` lo detecta y avisa.
- Para empezar de cero: detener la API y borrar `src/Gastos.Api/gastos.db`.
- Endpoints a mano: `src/Gastos.Api/Gastos.Api.http`. OpenAPI: `http://localhost:5080/openapi/v1.json`.
- .NET 10, `Directory.Build.props` con `Nullable` + `TreatWarningsAsErrors`: un warning rompe el build (excepto en proyectos de prueba).

## Arquitectura

Regla de dependencias: `Api → Application/Infrastructure → Domain`. **Application no conoce EF Core ni ASP.NET.** Verificado por `tests/Gastos.UnitTests/ArchitectureTests.cs`.

| Si estás escribiendo… | Va en | Ejemplo |
|---|---|---|
| Entidad o regla de negocio | `Gastos.Domain/<Feature>/` | `Expense.Create()`, `ExpenseRules` |
| Tipo compartido del dominio | `Gastos.Domain/Common/` | `Result<T>`, `Error`, `EntityId` |
| Operación que cambia datos | `Gastos.Application/<Feature>/XCommand` | `CreateExpense.cs` |
| Lectura | `Gastos.Application/<Feature>/XQuery` | `GetMonthlySummary.cs` |
| Puerto hacia afuera | `Gastos.Application/Abstractions/` | repositorios, `IClock`, `IIdGenerator` |
| Acceso a datos | `Gastos.Infrastructure/Persistence/` | `ExpenseRepository`, `ExpenseConfiguration` |
| Endpoint HTTP | `Gastos.Api/Endpoints/<Feature>Endpoints.cs` | `MapExpenseEndpoints()` |
| Prueba sin BD | `tests/Gastos.UnitTests/` | handlers con los fakes de `Application/Fakes.cs` |
| Prueba de punta a punta | `tests/Gastos.IntegrationTests/` | `WebApplicationFactory` + SQLite temporal |

- CQRS con handlers propios: **no MediatR, no paquete de DI externo.** Cada handler implementa `ICommandHandler`/`IQueryHandler` y se registra solo por reflexión en `Gastos.Api/Composition/ApplicationRegistration.cs`. `ArchitectureTests` exige **exactamente un handler** por command/query.
- Endpoints Minimal API inyectan el handler directo y traducen con `ResultExtensions.ToHttpResult` (errores → Problem Details).
- `DataSeeder` (Infrastructure) siembra categorías por defecto y gastos de ejemplo solo en Development.

## Convenciones C#

- **Un caso de uso = un archivo** con su `record` (command/query) y su handler `sealed`; el archivo se llama como la acción.
- Records inmutables para commands, queries y DTOs; entidades con **setters privados** que solo cambian vía `Create`/`Update` (que validan).
- **IMPORTANT: errores de negocio como valores (`Result<T>`), nunca excepciones.** Las excepciones son solo para fallas técnicas y las atrapa `UseExceptionHandler`.
- Todos los errores de validación juntos, con **las mismas claves de campo que el frontend** (`amount`, `description`, `categoryId`, …). Enums JSON como strings camelCase.
- Endpoints delgados: request → command → handler → `ToHttpResult`. Sin lógica.
- `CancellationToken` en toda la cadena async. Primary constructors para inyección.
- Constantes compartidas (`ExpenseRules.MaxDescriptionLength`, `EntityId.MaxLength` = 64) usadas en validación **y** en la configuración de EF.
- Reloj e ids inyectados (`IClock`, `IIdGenerator`): nunca `DateTime.Now` ni `Guid.NewGuid()` en Domain/Application.
- Formato según `../.editorconfig`: file-scoped namespaces, `_campoPrivado`, usings de `System` primero.

## Receta: agregar un endpoint

1. Regla o cambio de entidad en `Gastos.Domain` + prueba unitaria.
2. `XCommand`/`XQuery` + handler en `Gastos.Application/<Feature>/` + prueba unitaria con fakes.
3. Si hacen falta datos nuevos: método en el puerto (`Abstractions`) e implementación en `Infrastructure`.
4. Endpoint en `Gastos.Api/Endpoints/` + ejemplo en `Gastos.Api.http`.
5. Prueba de integración en `tests/Gastos.IntegrationTests/ApiTests.cs`.
6. Si el frontend lo usa: acción del store → caso en `httpGateway.ts` (`persist()`).
