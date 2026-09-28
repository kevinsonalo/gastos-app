using Gastos.Application.Abstractions;
using Gastos.Infrastructure.Persistence;
using Gastos.Infrastructure.Persistence.Repositories;
using Gastos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Gastos.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registra EF Core con SQLite y las implementaciones de los puertos de Application.</summary>
    /// <param name="connectionString">
    /// Se resuelve al crear cada DbContext (no al arrancar), así las pruebas de integración
    /// pueden reemplazar la cadena de conexión por configuración.
    /// </param>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, Func<IServiceProvider, string> connectionString)
    {
        services.AddDbContext<GastosDbContext>((provider, options) => options.UseSqlite(connectionString(provider)));

        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IExpenseRepository, ExpenseRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IIdGenerator, GuidIdGenerator>();

        return services;
    }
}
