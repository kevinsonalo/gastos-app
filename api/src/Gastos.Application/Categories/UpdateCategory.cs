using Gastos.Application.Abstractions;
using Gastos.Domain.Categories;
using Gastos.Domain.Common;

namespace Gastos.Application.Categories;

public sealed record UpdateCategoryCommand(string Id, string Name, string Color) : ICommand<CategoryDto>;

public sealed class UpdateCategoryHandler(ICategoryRepository categories, IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateCategoryCommand, CategoryDto>
{
    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand command, CancellationToken ct)
    {
        var category = await categories.GetByIdAsync(command.Id, ct);
        if (category is null) return Error.NotFound("La categoría ya no existe.");

        var all = await categories.GetAllAsync(ct);
        if (all.Any(c => c.Id != command.Id && CategoryRules.SameName(c.Name, command.Name ?? string.Empty)))
            return Error.Validation("name", "Ya existe una categoría con ese nombre.");

        var updated = category.Update(command.Name ?? string.Empty, command.Color);
        if (!updated.IsSuccess) return updated.Error!;

        await unitOfWork.SaveChangesAsync(ct);
        return CategoryDto.From(category);
    }
}
