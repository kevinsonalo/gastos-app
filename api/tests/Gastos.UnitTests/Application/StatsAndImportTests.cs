using Gastos.Application.Categories;
using Gastos.Application.Expenses;
using Gastos.Application.Import;
using Gastos.Application.Stats;
using Gastos.Domain.Expenses;

namespace Gastos.UnitTests.Application;

public class StatsAndImportTests
{
    [Fact]
    public async Task Resumen_del_mes_en_curso_promedia_sobre_dias_transcurridos()
    {
        var store = InMemoryStore.WithCategories();
        store.AddExpense("a", 1000m, "car", new DateOnly(2026, 9, 2));
        store.AddExpense("b", 500m, "food", new DateOnly(2026, 9, 5));
        store.AddExpense("old", 9999m, "food", new DateOnly(2026, 8, 5));
        var clock = new FixedClock(new DateTime(2026, 9, 10, 12, 0, 0, DateTimeKind.Utc));

        var result = await new GetMonthlySummaryHandler(store, store, clock).Handle(new GetMonthlySummaryQuery("2026-09"), default);

        Assert.Equal(1500m, result.Value.Total);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(150m, result.Value.DailyAverage);
        Assert.Equal("car", result.Value.ByCategory[0].CategoryId);
        Assert.Equal(66.67m, result.Value.ByCategory[0].Percentage);
    }

    [Fact]
    public async Task Importar_reemplaza_todo_con_el_respaldo()
    {
        var store = InMemoryStore.WithCategories();
        store.AddExpense("viejo", 1m, "food", new DateOnly(2026, 1, 1));
        var created = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        var command = new ImportDataCommand(
            [new CategoryDto("c1", "Comida", "#AA0000", created)],
            [new ExpenseDto("e1", 10.5m, "Pan", "c1", new DateOnly(2026, 9, 2), PaymentMethod.Card, created, created)]);

        var result = await new ImportDataHandler(store, new FixedClock(created)).Handle(command, default);

        Assert.True(result.IsSuccess);
        Assert.Equal("c1", Assert.Single(store.Categories).Id);
        Assert.Equal("e1", Assert.Single(store.Expenses).Id);
    }

    [Fact]
    public async Task Importar_rechaza_gastos_con_categorias_inexistentes_sin_tocar_los_datos()
    {
        var store = InMemoryStore.WithCategories();
        var command = new ImportDataCommand(
            [],
            [new ExpenseDto("e1", 1m, "Pan", "fantasma", new DateOnly(2026, 9, 2), PaymentMethod.Card, default, default)]);

        var result = await new ImportDataHandler(store, new FixedClock(DateTime.UtcNow)).Handle(command, default);

        Assert.Contains("file", result.Error!.Fields!.Keys);
        Assert.Equal(2, store.Categories.Count);
    }
}
