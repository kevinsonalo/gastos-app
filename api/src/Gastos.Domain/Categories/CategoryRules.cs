using System.Text.RegularExpressions;

namespace Gastos.Domain.Categories;

/// <summary>Reglas de validación de categorías (mismas que <c>domain/rules/categoryRules.ts</c> del frontend).</summary>
public static partial class CategoryRules
{
    public const int MaxNameLength = 40;

    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColor();

    /// <summary>Valida formato. La unicidad del nombre se verifica en la capa de aplicación.</summary>
    public static Dictionary<string, string> Validate(string? name, string? color)
    {
        var errors = new Dictionary<string, string>();
        var trimmed = name?.Trim() ?? string.Empty;

        if (trimmed.Length == 0) errors["name"] = "El nombre es obligatorio.";
        else if (trimmed.Length > MaxNameLength) errors["name"] = $"Máximo {MaxNameLength} caracteres.";

        if (color is null || !HexColor().IsMatch(color)) errors["color"] = "Color inválido.";

        return errors;
    }

    public static (string Name, string Color) Normalize(string name, string color) =>
        (name.Trim(), color.ToLowerInvariant());

    /// <summary>Compara nombres ignorando mayúsculas y espacios en los extremos.</summary>
    public static bool SameName(string a, string b) =>
        string.Equals(a.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);
}
