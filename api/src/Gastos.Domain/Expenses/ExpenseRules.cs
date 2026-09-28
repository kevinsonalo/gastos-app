namespace Gastos.Domain.Expenses;

/// <summary>Reglas de validación de gastos (mismas que <c>domain/rules/expenseRules.ts</c> del frontend).</summary>
public static class ExpenseRules
{
    public const decimal MaxAmount = 1_000_000_000m;
    public const int MaxDescriptionLength = 120;

    public static Dictionary<string, string> Validate(ExpenseData data)
    {
        var errors = new Dictionary<string, string>();

        if (data.Amount <= 0) errors["amount"] = "El monto debe ser mayor a 0.";
        else if (data.Amount > MaxAmount) errors["amount"] = "El monto es demasiado alto.";

        var description = data.Description?.Trim() ?? string.Empty;
        if (description.Length == 0) errors["description"] = "La descripción es obligatoria.";
        else if (description.Length > MaxDescriptionLength) errors["description"] = $"Máximo {MaxDescriptionLength} caracteres.";

        if (string.IsNullOrWhiteSpace(data.CategoryId)) errors["categoryId"] = "Seleccioná una categoría válida.";

        if (!Enum.IsDefined(data.PaymentMethod)) errors["paymentMethod"] = "Método de pago inválido.";

        return errors;
    }

    /// <summary>Forma canónica: monto a 2 decimales con redondeo comercial (0.005 → 0.01) y texto sin espacios extremos.</summary>
    public static ExpenseData Normalize(ExpenseData data) => data with
    {
        Amount = Math.Round(data.Amount, 2, MidpointRounding.AwayFromZero),
        Description = data.Description.Trim(),
    };
}
