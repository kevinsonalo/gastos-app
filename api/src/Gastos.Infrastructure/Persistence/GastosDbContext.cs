using Gastos.Domain.Categories;
using Gastos.Domain.Expenses;
using Microsoft.EntityFrameworkCore;

namespace Gastos.Infrastructure.Persistence;

public sealed class GastosDbContext(DbContextOptions<GastosDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Expense> Expenses => Set<Expense>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GastosDbContext).Assembly);
}
