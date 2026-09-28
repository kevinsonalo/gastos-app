namespace Gastos.Domain.Common;

/// <summary>Tipo de error; la API lo traduce a un código HTTP.</summary>
public enum ErrorType
{
    Validation,
    NotFound,
    Conflict,
}

/// <summary>
/// Error de negocio como valor (no excepción). <see cref="Fields"/> lleva los mensajes
/// por campo cuando el error es de validación, con las mismas claves que usa el frontend.
/// </summary>
public sealed record Error(ErrorType Type, string Message, IReadOnlyDictionary<string, string>? Fields = null)
{
    public static Error Validation(IReadOnlyDictionary<string, string> fields) =>
        new(ErrorType.Validation, "Hay datos inválidos.", fields);

    public static Error Validation(string field, string message) =>
        Validation(new Dictionary<string, string> { [field] = message });

    public static Error NotFound(string message) => new(ErrorType.NotFound, message);

    public static Error Conflict(string message) => new(ErrorType.Conflict, message);
}
