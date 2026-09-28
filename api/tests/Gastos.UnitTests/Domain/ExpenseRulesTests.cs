using Gastos.Domain.Expenses;

namespace Gastos.UnitTests.Domain;

public class ExpenseRulesTests
{
    private static readonly ExpenseData Valid = new(2500m, "Almuerzo", "cat-1", new DateOnly(2026, 9, 27), PaymentMethod.Sinpe);

    [Fact]
    public void Acepta_un_gasto_valido() => Assert.Empty(ExpenseRules.Validate(Valid));

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(1_000_000_001)]
    public void Rechaza_montos_fuera_de_rango(decimal amount) =>
        Assert.Contains("amount", ExpenseRules.Validate(Valid with { Amount = amount }).Keys);

    [Fact]
    public void Rechaza_descripcion_vacia_o_solo_espacios() =>
        Assert.Contains("description", ExpenseRules.Validate(Valid with { Description = "   " }).Keys);

    [Fact]
    public void Rechaza_descripcion_de_mas_de_120_caracteres() =>
        Assert.Contains("description", ExpenseRules.Validate(Valid with { Description = new string('x', 121) }).Keys);

    [Fact]
    public void Rechaza_metodo_de_pago_inexistente() =>
        Assert.Contains("paymentMethod", ExpenseRules.Validate(Valid with { PaymentMethod = (PaymentMethod)99 }).Keys);

    [Fact]
    public void Normaliza_redondeando_a_dos_decimales_y_recortando_texto()
    {
        var normalized = ExpenseRules.Normalize(Valid with { Amount = 2500.555m, Description = "  Café  " });

        Assert.Equal(2500.56m, normalized.Amount);
        Assert.Equal("Café", normalized.Description);
    }

    [Fact]
    public void Update_conserva_CreatedAt_y_actualiza_UpdatedAt()
    {
        var created = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        var later = created.AddDays(3);
        var expense = Expense.Create("e1", Valid, created).Value;

        var result = expense.Update(Valid with { Amount = 99m }, later);

        Assert.True(result.IsSuccess);
        Assert.Equal(99m, expense.Amount);
        Assert.Equal(created, expense.CreatedAt);
        Assert.Equal(later, expense.UpdatedAt);
    }
}
