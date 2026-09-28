using Gastos.Application.Expenses;
using Gastos.Domain.Common;
using Gastos.Domain.Expenses;

namespace Gastos.UnitTests.Application;

public class ExpenseHandlersTests
{
    private static readonly DateTime Now = new(2026, 9, 28, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateOnly Today = new(2026, 9, 28);

    [Fact]
    public async Task Crear_genera_id_normaliza_y_guarda()
    {
        var store = InMemoryStore.WithCategories();
        var handler = new CreateExpenseHandler(store, store, store, new FixedClock(Now), new SequentialIds());

        var result = await handler.Handle(new CreateExpenseCommand(null, 10.555m, "  Café ", "food", Today, PaymentMethod.Cash), default);

        Assert.True(result.IsSuccess);
        Assert.Equal("id-1", result.Value.Id);
        Assert.Equal(10.56m, result.Value.Amount);
        Assert.Equal("Café", result.Value.Description);
        Assert.Equal(Now, result.Value.CreatedAt);
        Assert.Single(store.Expenses);
        Assert.Equal(1, store.SaveCount);
    }

    [Fact]
    public async Task Crear_respeta_el_id_enviado_por_el_frontend()
    {
        var store = InMemoryStore.WithCategories();
        var handler = new CreateExpenseHandler(store, store, store, new FixedClock(Now), new SequentialIds());

        var result = await handler.Handle(new CreateExpenseCommand("uuid-front", 100m, "Pan", "food", Today, PaymentMethod.Card), default);

        Assert.Equal("uuid-front", result.Value.Id);
    }

    [Fact]
    public async Task Crear_reporta_todos_los_errores_juntos_y_no_guarda()
    {
        var store = InMemoryStore.WithCategories();
        var handler = new CreateExpenseHandler(store, store, store, new FixedClock(Now), new SequentialIds());

        var result = await handler.Handle(new CreateExpenseCommand(null, 0m, " ", "no-existe", Today, PaymentMethod.Card), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Validation, result.Error!.Type);
        Assert.Equal(new[] { "amount", "categoryId", "description" }, result.Error.Fields!.Keys.Order());
        Assert.Empty(store.Expenses);
        Assert.Equal(0, store.SaveCount);
    }

    [Fact]
    public async Task Actualizar_un_gasto_inexistente_devuelve_NotFound()
    {
        var store = InMemoryStore.WithCategories();
        var handler = new UpdateExpenseHandler(store, store, store, new FixedClock(Now));

        var result = await handler.Handle(new UpdateExpenseCommand("nope", 1m, "x", "food", Today, PaymentMethod.Card), default);

        Assert.Equal(ErrorType.NotFound, result.Error!.Type);
    }

    [Fact]
    public async Task Eliminar_quita_el_gasto()
    {
        var store = InMemoryStore.WithCategories();
        store.AddExpense("e1", 100m, "food", Today);

        var result = await new DeleteExpenseHandler(store, store).Handle(new DeleteExpenseCommand("e1"), default);

        Assert.True(result.IsSuccess);
        Assert.Empty(store.Expenses);
    }

    [Fact]
    public async Task Listar_filtra_por_mes_categoria_y_texto()
    {
        var store = InMemoryStore.WithCategories();
        store.AddExpense("a", 1m, "food", new DateOnly(2026, 9, 1));
        store.AddExpense("b", 1m, "car", new DateOnly(2026, 9, 30));
        store.AddExpense("c", 1m, "food", new DateOnly(2026, 8, 31));
        var handler = new GetExpensesHandler(store);

        var september = await handler.Handle(new GetExpensesQuery("2026-09", null, null), default);
        var carOnly = await handler.Handle(new GetExpensesQuery(null, "car", null), default);
        var search = await handler.Handle(new GetExpensesQuery(null, null, "GASTO C"), default);

        Assert.Equal(new[] { "a", "b" }, september.Value.Select(e => e.Id).Order());
        Assert.Equal("b", Assert.Single(carOnly.Value).Id);
        Assert.Equal("c", Assert.Single(search.Value).Id);
    }

    [Fact]
    public async Task Listar_con_mes_invalido_devuelve_error_de_validacion()
    {
        var result = await new GetExpensesHandler(new InMemoryStore()).Handle(new GetExpensesQuery("2026-13", null, null), default);

        Assert.Contains("month", result.Error!.Fields!.Keys);
    }
}
