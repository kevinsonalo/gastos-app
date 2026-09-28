using Gastos.Application.Abstractions;
using Gastos.Domain.Common;

namespace Gastos.Application.Categories;

public sealed record GetCategoriesQuery : IQuery<IReadOnlyList<CategoryDto>>;

public sealed class GetCategoriesHandler(ICategoryRepository categories)
    : IQueryHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery query, CancellationToken ct)
    {
        var all = await categories.GetAllAsync(ct);
        return all.Select(CategoryDto.From).ToList();
    }
}
