using Gastos.Domain.Common;

namespace Gastos.Api.Endpoints;

/// <summary>Traduce el <see cref="Result"/> de un caso de uso a una respuesta HTTP (RFC 9457 Problem Details).</summary>
public static class ResultExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result, Func<T, IResult> onSuccess) =>
        result.IsSuccess ? onSuccess(result.Value) : result.Error!.ToProblem();

    public static IResult ToProblem(this Error error) => error.Type switch
    {
        ErrorType.Validation => Results.ValidationProblem(
            (error.Fields ?? new Dictionary<string, string>()).ToDictionary(f => f.Key, f => new[] { f.Value }),
            title: error.Message),
        ErrorType.NotFound => Results.Problem(error.Message, statusCode: StatusCodes.Status404NotFound, title: "No encontrado"),
        ErrorType.Conflict => Results.Problem(error.Message, statusCode: StatusCodes.Status409Conflict, title: "Conflicto"),
        _ => Results.Problem(error.Message),
    };
}
