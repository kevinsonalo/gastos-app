using Gastos.Application.Abstractions;
using Gastos.Domain.Categories;
using Gastos.Domain.Expenses;
using Microsoft.EntityFrameworkCore;

namespace Gastos.Infrastructure.Persistence;

internal sealed class UnitOfWork(GastosDbContext db) : IUnitOfWork
{
    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);

    public async Task ReplaceAllAsync(IEnumerable<Category> categories, IEnumerable<Expense> expenses, CancellationToken cancellationToken)
    {
        // Todo o nada: si algo falla, la base queda como estaba.
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        await db.Expenses.ExecuteDeleteAsync(cancellationToken);
        await db.Categories.ExecuteDeleteAsync(cancellationToken);

        db.Categories.AddRange(categories);
        db.Expenses.AddRange(expenses);
        await db.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }
}
