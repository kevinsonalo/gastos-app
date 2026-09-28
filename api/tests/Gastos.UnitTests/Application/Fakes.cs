using Gastos.Application.Abstractions;
using Gastos.Domain.Categories;
using Gastos.Domain.Expenses;

namespace Gastos.UnitTests.Application;

/// <summary>Base de datos en memoria para probar handlers sin EF Core.</summary>
internal sealed class InMemoryStore : ICategoryRepository, IExpenseRepository, IUnitOfWork
{
    public List<Category> Categories { get; } = [];
    public List<Expense> Expenses { get; } = [];
    public int SaveCount { get; private set; }

    Task<IReadOnlyList<Category>> ICategoryRepository.GetAllAsync(CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Category>>(Categories.ToList());

    Task<Category?> ICategoryRepository.GetByIdAsync(string id, CancellationToken ct) =>
        Task.FromResult(Categories.FirstOrDefault(c => c.Id == id));

    void ICategoryRepository.Add(Category category) => Categories.Add(category);

    void ICategoryRepository.Remove(Category category) => Categories.Remove(category);

    Task<IReadOnlyList<Expense>> IExpenseRepository.ListAsync(ExpenseFilter f, CancellationToken ct)
    {
        IEnumerable<Expense> q = Expenses;
        if (f.From is { } from) q = q.Where(e => e.Date >= from);
        if (f.To is { } to) q = q.Where(e => e.Date <= to);
        if (f.CategoryId is { } categoryId) q = q.Where(e => e.CategoryId == categoryId);
        if (f.Search is { } search) q = q.Where(e => e.Description.Contains(search, StringComparison.CurrentCultureIgnoreCase));
        return Task.FromResult<IReadOnlyList<Expense>>(q.OrderByDescending(e => e.Date).ToList());
    }

    Task<Expense?> IExpenseRepository.GetByIdAsync(string id, CancellationToken ct) =>
        Task.FromResult(Expenses.FirstOrDefault(e => e.Id == id));

    Task<int> IExpenseRepository.CountByCategoryAsync(string categoryId, CancellationToken ct) =>
        Task.FromResult(Expenses.Count(e => e.CategoryId == categoryId));

    void IExpenseRepository.Add(Expense expense) => Expenses.Add(expense);

    void IExpenseRepository.Remove(Expense expense) => Expenses.Remove(expense);

    Task IUnitOfWork.SaveChangesAsync(CancellationToken ct)
    {
        SaveCount++;
        return Task.CompletedTask;
    }

    Task IUnitOfWork.ReplaceAllAsync(IEnumerable<Category> categories, IEnumerable<Expense> expenses, CancellationToken ct)
    {
        Categories.Clear();
        Expenses.Clear();
        Categories.AddRange(categories);
        Expenses.AddRange(expenses);
        SaveCount++;
        return Task.CompletedTask;
    }

    /// <summary>Datos base: 2 categorías y ningún gasto.</summary>
    public static InMemoryStore WithCategories()
    {
        var store = new InMemoryStore();
        store.Categories.Add(Category.Create("food", "Alimentación", "#ff0000", DateTime.UnixEpoch).Value);
        store.Categories.Add(Category.Create("car", "Transporte", "#00ff00", DateTime.UnixEpoch).Value);
        return store;
    }

    public Expense AddExpense(string id, decimal amount, string categoryId, DateOnly date)
    {
        var expense = Expense.Create(id, new ExpenseData(amount, $"Gasto {id}", categoryId, date, PaymentMethod.Card), DateTime.UnixEpoch).Value;
        Expenses.Add(expense);
        return expense;
    }
}

internal sealed class FixedClock(DateTime utcNow) : IClock
{
    public DateTime UtcNow { get; } = utcNow;
}

internal sealed class SequentialIds : IIdGenerator
{
    private int _next;

    public string NewId() => $"id-{++_next}";
}
