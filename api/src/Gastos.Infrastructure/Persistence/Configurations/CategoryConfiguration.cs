using Gastos.Domain.Categories;
using Gastos.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gastos.Infrastructure.Persistence.Configurations;

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasMaxLength(EntityId.MaxLength);
        builder.Property(c => c.Name).HasMaxLength(CategoryRules.MaxNameLength).IsRequired();
        builder.Property(c => c.Color).HasMaxLength(7).IsRequired();
        builder.Property(c => c.CreatedAt).HasConversion(new UtcDateTimeConverter());
    }
}
