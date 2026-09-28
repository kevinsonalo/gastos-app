namespace Gastos.Domain.Common;

/// <summary>
/// Reglas de los identificadores. Los genera el frontend (UUID) o el servidor, y se guardan
/// como texto: por eso se limita el largo (evita un error de base de datos con ids enviados por el cliente).
/// </summary>
public static class EntityId
{
    public const int MaxLength = 64;

    public static bool IsValid(string? id) => !string.IsNullOrWhiteSpace(id) && id.Length <= MaxLength;

    public static Error Invalid() => Error.Validation("id", $"El id no es válido (máximo {MaxLength} caracteres).");
}
