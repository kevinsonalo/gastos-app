using Gastos.Domain.Categories;

namespace Gastos.Application.Categories;

/// <summary>Forma pública de una categoría (lo que ve el frontend).</summary>
public sealed record CategoryDto(string Id, string Name, string Color, DateTime CreatedAt)
{
    public static CategoryDto From(Category c) => new(c.Id, c.Name, c.Color, c.CreatedAt);
}
