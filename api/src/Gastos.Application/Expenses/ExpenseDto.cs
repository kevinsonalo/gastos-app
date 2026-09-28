using Gastos.Domain.Expenses;

namespace Gastos.Application.Expenses;

/// <summary>Forma pública de un gasto. Coincide con la interfaz <c>Expense</c> del frontend.</summary>
public sealed record ExpenseDto(
    string Id,
    decimal Amount,
    string Description,
    string CategoryId,
    DateOnly Date,
    PaymentMethod PaymentMethod,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static ExpenseDto From(Expense e) =>
        new(e.Id, e.Amount, e.Description, e.CategoryId, e.Date, e.PaymentMethod, e.CreatedAt, e.UpdatedAt);
}
