using Gastos.Infrastructure.Seed;

namespace Gastos.IntegrationTests;

public class SampleDataTests
{
    [Fact]
    public void Genera_6_meses_de_datos_sin_fechas_futuras()
    {
        var today = new DateOnly(2026, 9, 10);

        var expenses = DataSeeder.SampleExpenses(today).ToList();

        Assert.All(expenses, e => Assert.True(e.Date <= today));
        Assert.Equal(6, expenses.Select(e => (e.Date.Year, e.Date.Month)).Distinct().Count());
        Assert.Equal(expenses.Count, expenses.Select(e => e.Id).Distinct().Count());
    }
}
