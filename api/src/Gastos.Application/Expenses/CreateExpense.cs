using Gastos.Application.Abstractions;
using Gastos.Domain.Common;
using Gastos.Domain.Expenses;

namespace Gastos.Application.Expenses;

/// <param name="Id">Opcional: si el frontend envía su id se respeta; si no, lo genera el servidor.</param>
public sealed record CreateExpenseCommand(
    string? Id,
    decimal Amount,
    string Description,
    string CategoryId,
    DateOnly Date,
    PaymentMethod PaymentMethod) : ICommand<ExpenseDto>;

public sealed class CreateExpenseHandler(
    IExpenseRepository expenses,
    ICategoryRepository categories,
    IUnitOfWork unitOfWork,
    IClock clock,
    IIdGenerator ids) : ICommandHandler<CreateExpenseCommand, ExpenseDto>
{
    public async Task<Result<ExpenseDto>> Handle(CreateExpenseCommand command, CancellationToken ct)
    {
        var id = string.IsNullOrWhiteSpace(command.Id) ? ids.NewId() : command.Id;
        if (await expenses.GetByIdAsync(id, ct) is not null) return Error.Conflict($"Ya existe un gasto con id '{id}'.");

        var data = new ExpenseData(command.Amount, command.Description ?? string.Empty, command.CategoryId ?? string.Empty, command.Date, command.PaymentMethod);

        // Se reportan todos los errores juntos: los de formato (dominio) y la existencia de la categoría.
        var errors = ExpenseRules.Validate(data);
        if (!errors.ContainsKey("categoryId") && await categories.GetByIdAsync(data.CategoryId, ct) is null)
            errors["categoryId"] = "Seleccioná una categoría válida.";
        if (errors.Count > 0) return Error.Validation(errors);

        var created = Expense.Create(id, data, clock.UtcNow);
        if (!created.IsSuccess) return created.Error!;

        expenses.Add(created.Value);
        await unitOfWork.SaveChangesAsync(ct);
        return ExpenseDto.From(created.Value);
    }
}
