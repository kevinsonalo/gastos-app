using Gastos.Application.Abstractions;
using Gastos.Domain.Expenses;
using Microsoft.EntityFrameworkCore;

namespace Gastos.Infrastructure.Persistence.Repositories;

internal sealed class ExpenseRepository(GastosDbContext db) : IExpenseRepository
{
    public async Task<IReadOnlyList<Expense>> ListAsync(ExpenseFilter filter, CancellationToken cancellationToken)
    {
        IQueryable<Expense> query = db.Expenses.AsNoTracking();

        if (filter.From is { } from) query = query.Where(e => e.Date >= from);
        if (filter.To is { } to) query = query.Where(e => e.Date <= to);
        if (filter.CategoryId is { } categoryId) query = query.Where(e => e.CategoryId == categoryId);

        var list = await query
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync(cancellationToken);

        // La búsqueda de texto se hace en memoria: LIKE de SQLite no ignora mayúsculas en letras con tilde.
        if (filter.Search is { } search)
            list = list.Where(e => e.Description.Contains(search, StringComparison.CurrentCultureIgnoreCase)).ToList();

        return list;
    }

    public Task<Expense?> GetByIdAsync(string id, CancellationToken cancellationToken) =>
        db.Expenses.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public Task<int> CountByCategoryAsync(string categoryId, CancellationToken cancellationToken) =>
        db.Expenses.CountAsync(e => e.CategoryId == categoryId, cancellationToken);

    public void Add(Expense expense) => db.Expenses.Add(expense);

    public void Remove(Expense expense) => db.Expenses.Remove(expense);
}
