using Gastos.Domain.Common;

namespace Gastos.Domain.Expenses;

/// <summary>Gasto registrado por el usuario.</summary>
public sealed class Expense
{
    private Expense(
        string id,
        decimal amount,
        string description,
        string categoryId,
        DateOnly date,
        PaymentMethod paymentMethod,
        DateTime createdAt)
    {
        Id = id;
        Amount = amount;
        Description = description;
        CategoryId = categoryId;
        Date = date;
        PaymentMethod = paymentMethod;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    // Constructor para EF Core.
    private Expense() : this(string.Empty, 0, string.Empty, string.Empty, default, default, default) { }

    public string Id { get; private set; }
    public decimal Amount { get; private set; }
    public string Description { get; private set; }
    public string CategoryId { get; private set; }
    public DateOnly Date { get; private set; }
    public PaymentMethod PaymentMethod { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    /// <summary>
    /// Crea un gasto validado y normalizado. La existencia de la categoría la verifica la capa
    /// de aplicación, porque requiere consultar el repositorio.
    /// </summary>
    public static Result<Expense> Create(string id, ExpenseData data, DateTime now)
    {
        var errors = ExpenseRules.Validate(data);
        if (errors.Count > 0) return Error.Validation(errors);

        var normalized = ExpenseRules.Normalize(data);
        return new Expense(
            id,
            normalized.Amount,
            normalized.Description,
            normalized.CategoryId,
            normalized.Date,
            normalized.PaymentMethod,
            now);
    }

    public Result Update(ExpenseData data, DateTime now)
    {
        var errors = ExpenseRules.Validate(data);
        if (errors.Count > 0) return Error.Validation(errors);

        var normalized = ExpenseRules.Normalize(data);
        Amount = normalized.Amount;
        Description = normalized.Description;
        CategoryId = normalized.CategoryId;
        Date = normalized.Date;
        PaymentMethod = normalized.PaymentMethod;
        UpdatedAt = now;
        return Result.Success();
    }
}

/// <summary>Datos editables de un gasto (lo que llega del formulario).</summary>
public sealed record ExpenseData(
    decimal Amount,
    string Description,
    string CategoryId,
    DateOnly Date,
    PaymentMethod PaymentMethod);
