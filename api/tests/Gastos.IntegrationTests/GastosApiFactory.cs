using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace Gastos.IntegrationTests;

/// <summary>
/// Levanta la API completa en memoria con una base SQLite temporal (un archivo por clase de prueba),
/// con las 8 categorías por defecto y sin gastos de ejemplo.
/// </summary>
public sealed class GastosApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"gastos-test-{Guid.NewGuid():N}.db");

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Gastos", $"Data Source={_databasePath}");
        builder.UseSetting("Seed:SampleExpenses", "false");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools(); // Libera el archivo en Windows antes de borrarlo.
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }
}
