using Gastos.Application.Abstractions;
using Gastos.Domain.Common;

namespace Gastos.Application.Expenses;

/// <param name="Month">Formato YYYY-MM; null = todos los meses.</param>
public sealed record GetExpensesQuery(string? Month, string? CategoryId, string? Search) : IQuery<IReadOnlyList<ExpenseDto>>;

public sealed class GetExpensesHandler(IExpenseRepository expenses)
    : IQueryHandler<GetExpensesQuery, IReadOnlyList<ExpenseDto>>
{
    public async Task<Result<IReadOnlyList<ExpenseDto>>> Handle(GetExpensesQuery query, CancellationToken ct)
    {
        DateOnly? from = null, to = null;
        if (!string.IsNullOrWhiteSpace(query.Month))
        {
            if (!MonthRange.TryParse(query.Month, out var range))
                return Error.Validation("month", "El mes debe tener el formato YYYY-MM.");
            (from, to) = range;
        }

        var filter = new ExpenseFilter(from, to, NullIfBlank(query.CategoryId), NullIfBlank(query.Search));
        var list = await expenses.ListAsync(filter, ct);
        return list.Select(ExpenseDto.From).ToList();
    }

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
