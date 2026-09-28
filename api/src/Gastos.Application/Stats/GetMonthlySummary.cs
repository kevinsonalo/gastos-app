using Gastos.Application.Abstractions;
using Gastos.Application.Expenses;
using Gastos.Domain.Common;

namespace Gastos.Application.Stats;

public sealed record CategoryTotalDto(string CategoryId, string Name, string Color, decimal Total, int Count, decimal Percentage);

public sealed record MonthlySummaryDto(string Month, decimal Total, int Count, decimal DailyAverage, IReadOnlyList<CategoryTotalDto> ByCategory);

public sealed record GetMonthlySummaryQuery(string Month) : IQuery<MonthlySummaryDto>;

/// <summary>
/// Resumen del mes calculado en el servidor (útil para probar datos desde la API).
/// Los totales se calculan en memoria: SQLite no suma <c>decimal</c> en SQL (ver ADR-011).
/// </summary>
public sealed class GetMonthlySummaryHandler(IExpenseRepository expenses, ICategoryRepository categories, IClock clock)
    : IQueryHandler<GetMonthlySummaryQuery, MonthlySummaryDto>
{
    public async Task<Result<MonthlySummaryDto>> Handle(GetMonthlySummaryQuery query, CancellationToken ct)
    {
        if (!MonthRange.TryParse(query.Month, out var range))
            return Error.Validation("month", "El mes debe tener el formato YYYY-MM.");

        var inMonth = await expenses.ListAsync(new ExpenseFilter(range.From, range.To), ct);
        var byId = (await categories.GetAllAsync(ct)).ToDictionary(c => c.Id);
        var total = inMonth.Sum(e => e.Amount);

        // Mes en curso: promedio sobre los días transcurridos; meses pasados: sobre el mes completo.
        var today = DateOnly.FromDateTime(clock.UtcNow);
        var days = today >= range.From && today <= range.To ? today.Day : range.To.Day;

        var byCategory = inMonth
            .GroupBy(e => e.CategoryId)
            .Where(g => byId.ContainsKey(g.Key))
            .Select(g =>
            {
                var sum = g.Sum(e => e.Amount);
                var category = byId[g.Key];
                return new CategoryTotalDto(
                    category.Id,
                    category.Name,
                    category.Color,
                    sum,
                    g.Count(),
                    total > 0 ? Math.Round(sum / total * 100, 2) : 0);
            })
            .OrderByDescending(c => c.Total)
            .ToList();

        return new MonthlySummaryDto(query.Month, total, inMonth.Count, Math.Round(total / days, 2), byCategory);
    }
}
