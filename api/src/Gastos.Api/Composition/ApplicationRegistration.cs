using Gastos.Application.Abstractions;

namespace Gastos.Api.Composition;

/// <summary>
/// Registra automáticamente todos los handlers de la capa Application (reemplaza el
/// escaneo de MediatR). Así Application no depende de ningún paquete de DI.
/// </summary>
public static class ApplicationRegistration
{
    private static readonly Type[] HandlerInterfaces = [typeof(ICommandHandler<,>), typeof(IQueryHandler<,>)];

    public static IServiceCollection AddApplicationHandlers(this IServiceCollection services)
    {
        var handlers = typeof(ICommandHandler<,>).Assembly
            .GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false })
            .SelectMany(t => t.GetInterfaces()
                .Where(i => i.IsGenericType && HandlerInterfaces.Contains(i.GetGenericTypeDefinition()))
                .Select(i => (Service: i, Implementation: t)));

        foreach (var (service, implementation) in handlers)
            services.AddScoped(service, implementation);

        return services;
    }
}
