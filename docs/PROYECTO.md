# Proyecto: Mis Gastos — Objetivo Babel 2026

> Ficha del proyecto · Autor: Kevin Solano Muñoz · Repositorio: https://github.com/kevinsonalo/gastos-app

## 1. Objetivo

Desarrollar competencias en desarrollo web moderno y programación asistida por IA mediante la construcción de un módulo de gestión de gastos personales con **React y TypeScript**, apoyado en **Claude Code** a lo largo del ciclo de desarrollo, manteniendo la comprensión, validación y control técnico de todo lo implementado.

**Alineación organizacional:** *Adoptar el uso de la IA Generativa en el día a día de todos los que formamos parte de Babel Costa Rica.*

## 2. Key Results y evidencias

| KR | Descripción | Fecha meta | Evidencia | Estado |
|----|-------------|-----------|-----------|--------|
| KR1 | Diseñar la arquitectura con Claude Code como asistente técnico | 18-sep-2026 | [ARQUITECTURA.md](ARQUITECTURA.md): diagrama de componentes, modelo de datos, 8 ADRs | ✅ |
| KR2 | MVP funcional: registro de gastos, categorías, dashboard, persistencia | 25-sep-2026 | Repositorio Git, [capturas](img/), 38 pruebas | ✅ |
| KR3 | Aplicar Claude Code en ≥ 10 actividades del ciclo | 29-sep-2026 | [BITACORA_PROMPTS.md](BITACORA_PROMPTS.md), [CODE_REVIEW.md](CODE_REVIEW.md), [CLAUDE.md](../CLAUDE.md) | ✅ |
| KR4 | Completar el curso de Claude Code y documentar aprendizajes | 11-sep-2026 | Certificado del curso · [MEJORES_PRACTICAS_PROMPTS.md](MEJORES_PRACTICAS_PROMPTS.md) | ✅ |

## 3. Alcance funcional

| Módulo | Funcionalidades |
|--------|-----------------|
| Gastos | Crear, editar, eliminar; monto, descripción, categoría, fecha, método de pago (Tarjeta, Efectivo, SINPE Móvil, Transferencia) |
| Categorías | 8 por defecto; crear, renombrar, color; eliminación bloqueada si tiene gastos |
| Dashboard | Total del mes, variación vs mes anterior, promedio diario, registros, categoría principal, gasto por categoría, tendencia 6 meses |
| Filtros | Mes, categoría, búsqueda por texto |
| Datos | `localStorage` versionado **o API .NET 10 + SQLite**; exportar / importar respaldo JSON validado |

## 4. Stack y calidad

| Aspecto | Decisión |
|---------|----------|
| Frontend | React 19, TypeScript estricto, Vite 8 |
| Estado | `useReducer` en un hook dedicado (`useExpenseStore`) |
| Persistencia | Puerto `StoreGateway`: `localStorage` o API REST (.NET 10, EF Core + SQLite) |
| Backend | ASP.NET Core 10 Minimal APIs, Clean Architecture, CQRS con handlers propios, Problem Details |
| Pruebas | Frontend: Vitest, 77 pruebas (incluye arquitectura y gateways). Backend: xUnit, unitarias + integración con WebApplicationFactory |
| Calidad | `tsc -b` sin errores, oxlint 0 warnings, prueba E2E de humo con Playwright |
| Runtime | Node 20.19+ / 22 LTS (`.nvmrc`) |

## 5. Arquitectura en una línea

`components → hooks → domain` y `hooks → data`. El dominio es TypeScript puro (sin React ni storage) y se prueba en aislamiento. Detalle en [ARQUITECTURA.md](ARQUITECTURA.md).

## 6. Historial de hitos (commits)

| Commit | Hito |
|--------|------|
| `chore: scaffold` | Proyecto base Vite + React + TS |
| `docs: arquitectura` | KR1 — arquitectura, modelo de datos, ADRs |
| `feat(core)` | Dominio, validación, estadísticas, repositorio, store |
| `feat(ui)` | Registro, categorías, filtros, dashboard, respaldo |
| `test` | 38 pruebas unitarias |
| `fix` | Correcciones de la revisión de código |
| `docs: README…` | Bitácora, code review, capturas |
| `docs: CLAUDE.md…` | Contexto para Claude Code (`/init`), ficha del proyecto y mejores prácticas de prompts |

## 7. Cómo ejecutar

```bash
nvm use 22
npm install
npm run dev     # http://localhost:5173
npm test

# Backend (opcional)
dotnet run --project api/src/Gastos.Api
```

## 8. Próximos pasos (fase 2)

1. ~~API .NET + conexión del frontend~~ ✅ (ADR-011). Siguiente: migraciones EF Core y SQL Server / Azure SQL.
2. Autenticación Entra ID y datos por usuario.
3. Presupuestos por categoría con alertas.
4. Importación automática desde correos de notificación bancaria.
5. Despliegue en Azure Static Web Apps con GitHub Actions.
