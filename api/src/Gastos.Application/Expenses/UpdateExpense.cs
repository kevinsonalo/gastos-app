using Gastos.Application.Abstractions;
using Gastos.Domain.Common;
using Gastos.Domain.Expenses;

namespace Gastos.Application.Expenses;

public sealed record UpdateExpenseCommand(
    string Id,
    decimal Amount,
    string Description,
    string CategoryId,
    DateOnly Date,
    PaymentMethod PaymentMethod) : ICommand<ExpenseDto>;

public sealed class UpdateExpenseHandler(
    IExpenseRepository expenses,
    ICategoryRepository categories,
    IUnitOfWork unitOfWork,
    IClock clock) : ICommandHandler<UpdateExpenseCommand, ExpenseDto>
{
    public async Task<Result<ExpenseDto>> Handle(UpdateExpenseCommand command, CancellationToken ct)
    {
        var expense = await expenses.GetByIdAsync(command.Id, ct);
        if (expense is null) return Error.NotFound("El gasto ya no existe.");

        var data = new ExpenseData(command.Amount, command.Description ?? string.Empty, command.CategoryId ?? string.Empty, command.Date, command.PaymentMethod);

        // Se reportan todos los errores juntos: los de formato (dominio) y la existencia de la categoría.
        var errors = ExpenseRules.Validate(data);
        if (!errors.ContainsKey("categoryId") && await categories.GetByIdAsync(data.CategoryId, ct) is null)
            errors["categoryId"] = "Seleccioná una categoría válida.";
        if (errors.Count > 0) return Error.Validation(errors);

        var updated = expense.Update(data, clock.UtcNow);
        if (!updated.IsSuccess) return updated.Error!;

        await unitOfWork.SaveChangesAsync(ct);
        return ExpenseDto.From(expense);
    }
}
