using System.Net;
using System.Net.Http.Json;
using Gastos.Application.Categories;
using Gastos.Application.Expenses;
using Gastos.Application.Stats;
using Microsoft.AspNetCore.Mvc;

namespace Gastos.IntegrationTests;

/// <summary>Prueba de datos de punta a punta: HTTP → handlers → EF Core → SQLite.</summary>
public class ApiTests(GastosApiFactory factory) : IClassFixture<GastosApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private static object NewExpense(string description, decimal amount = 12_500m, string date = "2026-09-20", string categoryId = "cat-1") => new
    {
        amount,
        description,
        categoryId,
        date,
        paymentMethod = "card",
    };

    [Fact]
    public async Task Health_responde_ok()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Crea_las_8_categorias_por_defecto_con_los_mismos_ids_del_frontend()
    {
        var categories = await _client.GetFromJsonAsync<List<CategoryDto>>("/api/categories", GastosApiFactory.Json);

        Assert.NotNull(categories);
        Assert.Equal(8, categories.Count);
        Assert.Contains(categories, c => c.Id == "cat-1" && c.Name == "Alimentación");
    }

    [Fact]
    public async Task Crear_y_consultar_un_gasto_persiste_en_la_base()
    {
        var created = await _client.PostAsJsonAsync("/api/expenses", NewExpense("  Supermercado  ", 12_500.555m, "2026-07-15"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var dto = await created.Content.ReadFromJsonAsync<ExpenseDto>(GastosApiFactory.Json);
        Assert.Equal("Supermercado", dto!.Description);
        Assert.Equal(12_500.56m, dto.Amount);

        var july = await _client.GetFromJsonAsync<List<ExpenseDto>>("/api/expenses?month=2026-07", GastosApiFactory.Json);
        Assert.Contains(july!, e => e.Id == dto.Id);
    }

    [Fact]
    public async Task Datos_invalidos_devuelven_400_con_errores_por_campo()
    {
        var response = await _client.PostAsJsonAsync("/api/expenses", NewExpense(" ", 0m, categoryId: "no-existe"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.Contains("amount", problem!.Errors.Keys);
        Assert.Contains("description", problem.Errors.Keys);
        Assert.Contains("categoryId", problem.Errors.Keys);
    }

    [Fact]
    public async Task No_permite_eliminar_una_categoria_con_gastos()
    {
        await _client.PostAsJsonAsync("/api/expenses", NewExpense("Gasolina", categoryId: "cat-2"));

        var response = await _client.DeleteAsync("/api/categories/cat-2");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Actualizar_y_eliminar_un_gasto()
    {
        var created = await (await _client.PostAsJsonAsync("/api/expenses", NewExpense("Cine", 8_000m)))
            .Content.ReadFromJsonAsync<ExpenseDto>(GastosApiFactory.Json);

        var updated = await _client.PutAsJsonAsync($"/api/expenses/{created!.Id}", NewExpense("Cine 3D", 9_000m));
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        var deleted = await _client.DeleteAsync($"/api/expenses/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var again = await _client.DeleteAsync($"/api/expenses/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, again.StatusCode);
    }

    [Fact]
    public async Task Resumen_mensual_suma_los_gastos_del_mes()
    {
        await _client.PostAsJsonAsync("/api/expenses", NewExpense("Alquiler", 180_000m, "2025-01-01", "cat-3"));
        await _client.PostAsJsonAsync("/api/expenses", NewExpense("Luz", 20_000m, "2025-01-12", "cat-4"));

        var summary = await _client.GetFromJsonAsync<MonthlySummaryDto>("/api/stats/monthly?month=2025-01", GastosApiFactory.Json);

        Assert.Equal(200_000m, summary!.Total);
        Assert.Equal(2, summary.Count);
        Assert.Equal("cat-3", summary.ByCategory[0].CategoryId);
    }
}
