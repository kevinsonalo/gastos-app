using Gastos.Application.Abstractions;
using Gastos.Domain.Common;

namespace Gastos.Application.Categories;

public sealed record DeleteCategoryCommand(string Id) : ICommand<Unit>;

/// <summary>ADR-008: una categoría con gastos asociados no se puede eliminar.</summary>
public sealed class DeleteCategoryHandler(
    ICategoryRepository categories,
    IExpenseRepository expenses,
    IUnitOfWork unitOfWork) : ICommandHandler<DeleteCategoryCommand, Unit>
{
    public async Task<Result<Unit>> Handle(DeleteCategoryCommand command, CancellationToken ct)
    {
        var category = await categories.GetByIdAsync(command.Id, ct);
        if (category is null) return Error.NotFound("La categoría ya no existe.");

        var used = await expenses.CountByCategoryAsync(command.Id, ct);
        if (used > 0)
            return Error.Conflict($"La categoría tiene {used} gasto(s). Reasignalos antes de eliminarla.");

        categories.Remove(category);
        await unitOfWork.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
