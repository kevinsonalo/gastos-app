using Gastos.Domain.Common;

namespace Gastos.Domain.Categories;

/// <summary>Categoría de gasto. Se crea y modifica solo a través de métodos que validan sus reglas.</summary>
public sealed class Category
{
    private Category(string id, string name, string color, DateTime createdAt)
    {
        Id = id;
        Name = name;
        Color = color;
        CreatedAt = createdAt;
    }

    // Constructor para EF Core.
    private Category() : this(string.Empty, string.Empty, string.Empty, default) { }

    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Color { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static Result<Category> Create(string id, string name, string color, DateTime createdAt)
    {
        var errors = CategoryRules.Validate(name, color);
        if (errors.Count > 0) return Error.Validation(errors);

        var (normalizedName, normalizedColor) = CategoryRules.Normalize(name, color);
        return new Category(id, normalizedName, normalizedColor, createdAt);
    }

    public Result Update(string name, string color)
    {
        var errors = CategoryRules.Validate(name, color);
        if (errors.Count > 0) return Error.Validation(errors);

        (Name, Color) = CategoryRules.Normalize(name, color);
        return Result.Success();
    }
}
