using Gastos.Application.Abstractions;
using Gastos.Application.Expenses;
using Gastos.Domain.Expenses;

namespace Gastos.Api.Endpoints;

public static class ExpenseEndpoints
{
    public sealed record ExpenseRequest(
        string? Id,
        decimal Amount,
        string Description,
        string CategoryId,
        DateOnly Date,
        PaymentMethod PaymentMethod);

    public static IEndpointRouteBuilder MapExpenseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/expenses").WithTags("Gastos");

        // GET /api/expenses?month=2026-09&categoryId=cat-1&search=super
        group.MapGet("/", async (
            string? month,
            string? categoryId,
            string? search,
            IQueryHandler<GetExpensesQuery, IReadOnlyList<ExpenseDto>> handler,
            CancellationToken ct) =>
            (await handler.Handle(new GetExpensesQuery(month, categoryId, search), ct)).ToHttpResult(dto => Results.Ok(dto)));

        group.MapPost("/", async (ExpenseRequest body, ICommandHandler<CreateExpenseCommand, ExpenseDto> handler, CancellationToken ct) =>
            (await handler.Handle(
                new CreateExpenseCommand(body.Id, body.Amount, body.Description, body.CategoryId, body.Date, body.PaymentMethod), ct))
                .ToHttpResult(dto => Results.Created($"/api/expenses/{dto.Id}", dto)));

        group.MapPut("/{id}", async (string id, ExpenseRequest body, ICommandHandler<UpdateExpenseCommand, ExpenseDto> handler, CancellationToken ct) =>
            (await handler.Handle(
                new UpdateExpenseCommand(id, body.Amount, body.Description, body.CategoryId, body.Date, body.PaymentMethod), ct))
                .ToHttpResult(dto => Results.Ok(dto)));

        group.MapDelete("/{id}", async (string id, ICommandHandler<DeleteExpenseCommand, Unit> handler, CancellationToken ct) =>
            (await handler.Handle(new DeleteExpenseCommand(id), ct)).ToHttpResult(_ => Results.NoContent()));

        return app;
    }
}
