namespace Gastos.Domain.Expenses;

/// <summary>Métodos de pago. En JSON se serializan en camelCase: "card", "cash", "sinpe", "transfer".</summary>
public enum PaymentMethod
{
    Card,
    Cash,
    Sinpe,
    Transfer,
}
