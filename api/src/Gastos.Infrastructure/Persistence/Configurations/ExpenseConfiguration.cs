using Gastos.Domain.Categories;
using Gastos.Domain.Expenses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gastos.Infrastructure.Persistence.Configurations;

internal sealed class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("Expenses");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasMaxLength(64);
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Description).HasMaxLength(ExpenseRules.MaxDescriptionLength).IsRequired();
        builder.Property(e => e.CategoryId).HasMaxLength(64).IsRequired();
        builder.Property(e => e.PaymentMethod).HasConversion<string>().HasMaxLength(16);
        builder.Property(e => e.CreatedAt).HasConversion(new UtcDateTimeConverter());
        builder.Property(e => e.UpdatedAt).HasConversion(new UtcDateTimeConverter());

        // ADR-008 también en la base: no se puede borrar una categoría con gastos.
        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.Date);
        builder.HasIndex(e => e.CategoryId);
    }
}
