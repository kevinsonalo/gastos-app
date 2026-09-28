using Gastos.Application.Abstractions;
using Gastos.Application.Categories;
using Gastos.Application.Expenses;
using Gastos.Domain.Categories;
using Gastos.Domain.Common;
using Gastos.Domain.Expenses;

namespace Gastos.Application.Import;

/// <summary>Reemplaza todos los datos por los de un respaldo del frontend (botón "Importar JSON").</summary>
public sealed record ImportDataCommand(IReadOnlyList<CategoryDto> Categories, IReadOnlyList<ExpenseDto> Expenses) : ICommand<Unit>;

public sealed class ImportDataHandler(IUnitOfWork unitOfWork, IClock clock) : ICommandHandler<ImportDataCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ImportDataCommand command, CancellationToken ct)
    {
        var categories = new List<Category>();
        foreach (var c in command.Categories)
        {
            var created = Category.Create(c.Id, c.Name, c.Color, c.CreatedAt == default ? clock.UtcNow : c.CreatedAt);
            if (!created.IsSuccess) return Error.Validation("file", $"Categoría inválida '{c.Id}'.");
            categories.Add(created.Value);
        }

        var categoryIds = categories.Select(c => c.Id).ToHashSet();
        var expenses = new List<Expense>();
        foreach (var e in command.Expenses)
        {
            if (!categoryIds.Contains(e.CategoryId)) return Error.Validation("file", "Hay gastos con categorías inexistentes.");

            var data = new ExpenseData(e.Amount, e.Description, e.CategoryId, e.Date, e.PaymentMethod);
            var created = Expense.Create(e.Id, data, e.CreatedAt == default ? clock.UtcNow : e.CreatedAt);
            if (!created.IsSuccess) return Error.Validation("file", $"Gasto inválido '{e.Id}'.");
            expenses.Add(created.Value);
        }

        await unitOfWork.ReplaceAllAsync(categories, expenses, ct);
        return Unit.Value;
    }
}
