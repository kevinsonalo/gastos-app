using Gastos.Application.Categories;
using Gastos.Domain.Common;

namespace Gastos.UnitTests.Application;

public class CategoryHandlersTests
{
    private static readonly FixedClock Clock = new(new DateTime(2026, 9, 28, 0, 0, 0, DateTimeKind.Utc));

    [Fact]
    public async Task Crear_rechaza_nombre_duplicado_sin_importar_mayusculas()
    {
        var store = InMemoryStore.WithCategories();
        var handler = new CreateCategoryHandler(store, store, Clock, new SequentialIds());

        var result = await handler.Handle(new CreateCategoryCommand(null, " transporte ", "#123456"), default);

        Assert.Contains("name", result.Error!.Fields!.Keys);
        Assert.Equal(2, store.Categories.Count);
    }

    [Fact]
    public async Task Actualizar_permite_conservar_el_mismo_nombre()
    {
        var store = InMemoryStore.WithCategories();
        var handler = new UpdateCategoryHandler(store, store);

        var result = await handler.Handle(new UpdateCategoryCommand("car", "Transporte", "#0000FF"), default);

        Assert.True(result.IsSuccess);
        Assert.Equal("#0000ff", result.Value.Color);
    }

    [Fact]
    public async Task Eliminar_una_categoria_con_gastos_devuelve_Conflict_ADR_008()
    {
        var store = InMemoryStore.WithCategories();
        store.AddExpense("e1", 100m, "food", new DateOnly(2026, 9, 1));
        var handler = new DeleteCategoryHandler(store, store, store);

        var inUse = await handler.Handle(new DeleteCategoryCommand("food"), default);
        var unused = await handler.Handle(new DeleteCategoryCommand("car"), default);

        Assert.Equal(ErrorType.Conflict, inUse.Error!.Type);
        Assert.True(unused.IsSuccess);
        Assert.Equal("food", Assert.Single(store.Categories).Id);
    }
}
