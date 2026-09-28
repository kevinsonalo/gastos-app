using Gastos.Domain.Common;

namespace Gastos.Application.Abstractions;

/// <summary>Comando: modifica el estado. Equivalente a <c>IRequest</c> de MediatR.</summary>
public interface ICommand<TResponse>;

/// <summary>Consulta: solo lee datos.</summary>
public interface IQuery<TResponse>;

/// <summary>Maneja un comando. Cada caso de uso tiene exactamente un handler.</summary>
public interface ICommandHandler<in TCommand, TResponse>
    where TCommand : ICommand<TResponse>
{
    Task<Result<TResponse>> Handle(TCommand command, CancellationToken cancellationToken);
}

/// <summary>Maneja una consulta.</summary>
public interface IQueryHandler<in TQuery, TResponse>
    where TQuery : IQuery<TResponse>
{
    Task<Result<TResponse>> Handle(TQuery query, CancellationToken cancellationToken);
}

/// <summary>Respuesta vacía para comandos que no devuelven datos (p. ej. eliminar).</summary>
public readonly record struct Unit
{
    public static readonly Unit Value = new();
}
