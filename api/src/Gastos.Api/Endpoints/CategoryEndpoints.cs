using Gastos.Application.Abstractions;
using Gastos.Application.Categories;

namespace Gastos.Api.Endpoints;

public static class CategoryEndpoints
{
    public sealed record CategoryRequest(string? Id, string Name, string Color);

    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categories").WithTags("Categorías");

        group.MapGet("/", async (IQueryHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>> handler, CancellationToken ct) =>
            (await handler.Handle(new GetCategoriesQuery(), ct)).ToHttpResult(dto => Results.Ok(dto)));

        group.MapPost("/", async (CategoryRequest body, ICommandHandler<CreateCategoryCommand, CategoryDto> handler, CancellationToken ct) =>
            (await handler.Handle(new CreateCategoryCommand(body.Id, body.Name, body.Color), ct))
                .ToHttpResult(dto => Results.Created($"/api/categories/{dto.Id}", dto)));

        group.MapPut("/{id}", async (string id, CategoryRequest body, ICommandHandler<UpdateCategoryCommand, CategoryDto> handler, CancellationToken ct) =>
            (await handler.Handle(new UpdateCategoryCommand(id, body.Name, body.Color), ct)).ToHttpResult(dto => Results.Ok(dto)));

        group.MapDelete("/{id}", async (string id, ICommandHandler<DeleteCategoryCommand, Unit> handler, CancellationToken ct) =>
            (await handler.Handle(new DeleteCategoryCommand(id), ct)).ToHttpResult(_ => Results.NoContent()));

        return app;
    }
}
