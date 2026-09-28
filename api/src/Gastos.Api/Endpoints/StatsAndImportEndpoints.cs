using Gastos.Application.Abstractions;
using Gastos.Application.Import;
using Gastos.Application.Stats;

namespace Gastos.Api.Endpoints;

public static class StatsAndImportEndpoints
{
    public static IEndpointRouteBuilder MapStatsAndImportEndpoints(this IEndpointRouteBuilder app)
    {
        // GET /api/stats/monthly?month=2026-09
        app.MapGet("/api/stats/monthly", async (
                string month,
                IQueryHandler<GetMonthlySummaryQuery, MonthlySummaryDto> handler,
                CancellationToken ct) =>
            (await handler.Handle(new GetMonthlySummaryQuery(month), ct)).ToHttpResult(dto => Results.Ok(dto)))
            .WithTags("Estadísticas");

        // POST /api/import  → reemplaza todos los datos con un respaldo JSON del frontend.
        app.MapPost("/api/import", async (ImportDataCommand body, ICommandHandler<ImportDataCommand, Unit> handler, CancellationToken ct) =>
            (await handler.Handle(body, ct)).ToHttpResult(_ => Results.NoContent()))
            .WithTags("Respaldo");

        return app;
    }
}
