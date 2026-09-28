using System.Reflection;
using Gastos.Application.Abstractions;
using Gastos.Domain.Expenses;

namespace Gastos.UnitTests;

/// <summary>
/// Regla de dependencias de Clean Architecture verificada automáticamente
/// (equivalente a <c>src/__tests__/architecture.test.ts</c> del frontend).
/// </summary>
public class ArchitectureTests
{
    private static readonly Assembly Domain = typeof(Expense).Assembly;
    private static readonly Assembly Application = typeof(ICommand<>).Assembly;

    private static string[] ReferencesOf(Assembly assembly) =>
        assembly.GetReferencedAssemblies().Select(a => a.Name ?? string.Empty).ToArray();

    [Theory]
    [InlineData("Gastos.Application")]
    [InlineData("Gastos.Infrastructure")]
    [InlineData("Gastos.Api")]
    [InlineData("Microsoft.EntityFrameworkCore")]
    [InlineData("Microsoft.AspNetCore")]
    public void El_dominio_no_depende_de_otras_capas_ni_frameworks(string forbidden) =>
        Assert.DoesNotContain(ReferencesOf(Domain), name => name.StartsWith(forbidden, StringComparison.Ordinal));

    [Theory]
    [InlineData("Gastos.Infrastructure")]
    [InlineData("Gastos.Api")]
    [InlineData("Microsoft.EntityFrameworkCore")]
    [InlineData("Microsoft.AspNetCore")]
    [InlineData("Microsoft.Extensions.DependencyInjection")]
    public void La_aplicacion_solo_depende_del_dominio(string forbidden) =>
        Assert.DoesNotContain(ReferencesOf(Application), name => name.StartsWith(forbidden, StringComparison.Ordinal));

    [Fact]
    public void Cada_comando_y_consulta_tiene_exactamente_un_handler()
    {
        var types = Application.GetTypes();
        var requests = types.Where(t => t is { IsClass: true, IsAbstract: false } && t.GetInterfaces().Any(IsRequest));

        Assert.All(requests, request =>
        {
            var handlers = types.Count(t => t.GetInterfaces().Any(i => IsHandler(i) && i.GetGenericArguments()[0] == request));
            Assert.True(handlers == 1, $"{request.Name} tiene {handlers} handlers (debe tener 1).");
        });
    }

    private static bool IsRequest(Type i) =>
        i.IsGenericType && (i.GetGenericTypeDefinition() == typeof(ICommand<>) || i.GetGenericTypeDefinition() == typeof(IQuery<>));

    private static bool IsHandler(Type i) =>
        i.IsGenericType && (i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>) || i.GetGenericTypeDefinition() == typeof(IQueryHandler<,>));
}
