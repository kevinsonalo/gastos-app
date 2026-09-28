namespace Gastos.Domain.Common;

/// <summary>Resultado de una operación sin valor de retorno: éxito o <see cref="Error"/>.</summary>
public class Result
{
    protected Result(Error? error) => Error = error;

    public Error? Error { get; }

    public bool IsSuccess => Error is null;

    public static Result Success() => new(null);

    public static Result Failure(Error error) => new(error);

    public static implicit operator Result(Error error) => Failure(error);
}

/// <summary>Resultado con valor: éxito con <see cref="Value"/> o <see cref="Error"/>.</summary>
public sealed class Result<T> : Result
{
    private readonly T? _value;

    private Result(T value) : base(null) => _value = value;

    private Result(Error error) : base(error) => _value = default;

    /// <summary>Valor del resultado. Solo es válido leerlo si <see cref="Result.IsSuccess"/>.</summary>
    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("No se puede leer el valor de un resultado fallido.");

    public static Result<T> Success(T value) => new(value);

    public static new Result<T> Failure(Error error) => new(error);

    public static implicit operator Result<T>(T value) => Success(value);

    public static implicit operator Result<T>(Error error) => Failure(error);
}
