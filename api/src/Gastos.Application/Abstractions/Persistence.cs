using Gastos.Domain.Categories;
using Gastos.Domain.Expenses;

namespace Gastos.Application.Abstractions;

/// <summary>Puerto de persistencia de categorías. Lo implementa la infraestructura (EF Core).</summary>
public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken);
    Task<Category?> GetByIdAsync(string id, CancellationToken cancellationToken);
    void Add(Category category);
    void Remove(Category category);
}

/// <summary>Criterios de búsqueda de gastos (mismos que <c>ExpenseFilters</c> del frontend).</summary>
public sealed record ExpenseFilter(DateOnly? From = null, DateOnly? To = null, string? CategoryId = null, string? Search = null);

/// <summary>Puerto de persistencia de gastos.</summary>
public interface IExpenseRepository
{
    Task<IReadOnlyList<Expense>> ListAsync(ExpenseFilter filter, CancellationToken cancellationToken);
    Task<Expense?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<int> CountByCategoryAsync(string categoryId, CancellationToken cancellationToken);
    void Add(Expense expense);
    void Remove(Expense expense);
}

/// <summary>Confirma los cambios pendientes en una sola transacción.</summary>
public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken);

    /// <summary>Borra todos los datos y deja listos los nuevos (usado por la importación de respaldos).</summary>
    Task ReplaceAllAsync(IEnumerable<Category> categories, IEnumerable<Expense> expenses, CancellationToken cancellationToken);
}

/// <summary>Reloj inyectable para que las pruebas sean deterministas.</summary>
public interface IClock
{
    DateTime UtcNow { get; }
}

/// <summary>Genera identificadores cuando el cliente no envía uno.</summary>
public interface IIdGenerator
{
    string NewId();
}
