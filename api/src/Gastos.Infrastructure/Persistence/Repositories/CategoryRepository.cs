using Gastos.Application.Abstractions;
using Gastos.Domain.Categories;
using Microsoft.EntityFrameworkCore;

namespace Gastos.Infrastructure.Persistence.Repositories;

internal sealed class CategoryRepository(GastosDbContext db) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken) =>
        await db.Categories.OrderBy(c => c.CreatedAt).ThenBy(c => c.Name).ToListAsync(cancellationToken);

    public Task<Category?> GetByIdAsync(string id, CancellationToken cancellationToken) =>
        db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public void Add(Category category) => db.Categories.Add(category);

    public void Remove(Category category) => db.Categories.Remove(category);
}
