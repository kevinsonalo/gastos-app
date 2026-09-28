using System.Text.Json;
using System.Text.Json.Serialization;
using Gastos.Api.Composition;
using Gastos.Api.Endpoints;
using Gastos.Application.Abstractions;
using Gastos.Infrastructure;
using Gastos.Infrastructure.Persistence;
using Gastos.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

// ---------- Servicios (composition root) ----------
builder.Services
    .AddApplicationHandlers()
    .AddInfrastructure(provider =>
        provider.GetRequiredService<IConfiguration>().GetConnectionString("Gastos") ?? "Data Source=gastos.db");

// JSON con el mismo formato que el frontend: camelCase y enums como texto ("card", "sinpe").
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));

builder.Services.AddProblemDetails();

// JSON mal formado o valores inválidos (p. ej. paymentMethod desconocido) → 400, no 500.
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = false);
builder.Services.AddOpenApi();

const string FrontendCors = "frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddPolicy(FrontendCors, policy =>
{
    if (builder.Environment.IsDevelopment())
        // Vite usa 5174, 5175… si el puerto 5173 está ocupado: se acepta cualquier puerto de localhost.
        policy.SetIsOriginAllowed(origin => Uri.TryCreate(origin, UriKind.Absolute, out var uri) && uri.IsLoopback);
    else
        policy.WithOrigins(allowedOrigins);

    policy.AllowAnyHeader().AllowAnyMethod();
}));

var app = builder.Build();

// ---------- Base de datos y datos de prueba ----------
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GastosDbContext>();
    var clock = scope.ServiceProvider.GetRequiredService<IClock>();
    var sampleData = app.Configuration.GetValue("Seed:SampleExpenses", false);
    await DataSeeder.SeedAsync(db, clock, sampleData);
}

// ---------- Pipeline HTTP ----------
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors(FrontendCors);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // /openapi/v1.json
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).WithTags("Salud");
app.MapCategoryEndpoints();
app.MapExpenseEndpoints();
app.MapStatsAndImportEndpoints();

app.Run();

/// <summary>Expuesto para las pruebas de integración con WebApplicationFactory.</summary>
public partial class Program;
