using Gastos.Application.Abstractions;
using Gastos.Domain.Categories;
using Gastos.Domain.Common;

namespace Gastos.Application.Categories;

/// <param name="Id">Opcional: el frontend genera sus propios ids; si no viene, lo genera el servidor.</param>
public sealed record CreateCategoryCommand(string? Id, string Name, string Color) : ICommand<CategoryDto>;

public sealed class CreateCategoryHandler(
    ICategoryRepository categories,
    IUnitOfWork unitOfWork,
    IClock clock,
    IIdGenerator ids) : ICommandHandler<CreateCategoryCommand, CategoryDto>
{
    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand command, CancellationToken ct)
    {
        var existing = await categories.GetAllAsync(ct);
        var id = string.IsNullOrWhiteSpace(command.Id) ? ids.NewId() : command.Id;
        if (!EntityId.IsValid(id)) return EntityId.Invalid();

        if (existing.Any(c => c.Id == id)) return Error.Conflict($"Ya existe una categoría con id '{id}'.");
        if (existing.Any(c => CategoryRules.SameName(c.Name, command.Name ?? string.Empty)))
            return Error.Validation("name", "Ya existe una categoría con ese nombre.");

        var created = Category.Create(id, command.Name ?? string.Empty, command.Color, clock.UtcNow);
        if (!created.IsSuccess) return created.Error!;

        categories.Add(created.Value);
        await unitOfWork.SaveChangesAsync(ct);
        return CategoryDto.From(created.Value);
    }
}
