using Gastos.Application.Abstractions;
using Gastos.Domain.Common;

namespace Gastos.Application.Expenses;

public sealed record DeleteExpenseCommand(string Id) : ICommand<Unit>;

public sealed class DeleteExpenseHandler(IExpenseRepository expenses, IUnitOfWork unitOfWork)
    : ICommandHandler<DeleteExpenseCommand, Unit>
{
    public async Task<Result<Unit>> Handle(DeleteExpenseCommand command, CancellationToken ct)
    {
        var expense = await expenses.GetByIdAsync(command.Id, ct);
        if (expense is null) return Error.NotFound("El gasto ya no existe.");

        expenses.Remove(expense);
        await unitOfWork.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
