using Gastos.Application.Abstractions;
using Gastos.Domain.Categories;
using Gastos.Domain.Expenses;
using Gastos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gastos.Infrastructure.Seed;

/// <summary>
/// Crea la base (si no existe), las 8 categorías por defecto (mismos ids que el frontend)
/// y, opcionalmente, 6 meses de gastos de ejemplo para probar el dashboard.
/// </summary>
public static class DataSeeder
{
    private static readonly (string Id, string Name, string Color)[] DefaultCategories =
    [
        ("cat-1", "Alimentación", "#e07a5f"),
        ("cat-2", "Transporte", "#3d85c6"),
        ("cat-3", "Vivienda", "#81b29a"),
        ("cat-4", "Servicios", "#f2cc8f"),
        ("cat-5", "Salud", "#c97cc4"),
        ("cat-6", "Entretenimiento", "#5bc0be"),
        ("cat-7", "Educación", "#6a67ce"),
        ("cat-8", "Otros", "#8d99ae"),
    ];

    /// <summary>Plantilla mensual: descripción, categoría, monto base, método de pago y día del mes.</summary>
    private static readonly (string Description, string CategoryId, decimal Amount, PaymentMethod Method, int Day)[] MonthlyTemplate =
    [
        ("Alquiler", "cat-3", 180_000m, PaymentMethod.Transfer, 1),
        ("Supermercado", "cat-1", 42_500m, PaymentMethod.Card, 3),
        ("Gasolina", "cat-2", 25_000m, PaymentMethod.Card, 5),
        ("Almuerzo con el equipo", "cat-1", 6_500m, PaymentMethod.Sinpe, 8),
        ("Luz y agua", "cat-4", 28_900m, PaymentMethod.Transfer, 12),
        ("Internet y cable", "cat-4", 22_000m, PaymentMethod.Card, 15),
        ("Supermercado", "cat-1", 38_750m, PaymentMethod.Card, 17),
        ("Cine", "cat-6", 8_000m, PaymentMethod.Sinpe, 19),
        ("Farmacia", "cat-5", 12_300m, PaymentMethod.Cash, 21),
        ("Gasolina", "cat-2", 24_000m, PaymentMethod.Card, 23),
        ("Curso en línea", "cat-7", 15_000m, PaymentMethod.Card, 25),
        ("Regalo de cumpleaños", "cat-8", 18_000m, PaymentMethod.Cash, 27),
    ];

    public static async Task SeedAsync(GastosDbContext db, IClock clock, bool includeSampleExpenses, CancellationToken cancellationToken = default)
    {
        await db.Database.EnsureCreatedAsync(cancellationToken);

        if (!await db.Categories.AnyAsync(cancellationToken))
        {
            var createdAt = DateTime.UnixEpoch;
            foreach (var (id, name, color) in DefaultCategories)
                db.Categories.Add(Category.Create(id, name, color, createdAt).Value);
            await db.SaveChangesAsync(cancellationToken);
        }

        if (includeSampleExpenses && !await db.Expenses.AnyAsync(cancellationToken))
        {
            db.Expenses.AddRange(SampleExpenses(DateOnly.FromDateTime(clock.UtcNow)));
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>Genera gastos de los últimos 6 meses, con montos que varían de forma determinista por mes.</summary>
    internal static IEnumerable<Expense> SampleExpenses(DateOnly today)
    {
        var currentMonth = new DateOnly(today.Year, today.Month, 1);

        for (var monthsAgo = 5; monthsAgo >= 0; monthsAgo--)
        {
            var month = currentMonth.AddMonths(-monthsAgo);
            var daysInMonth = DateTime.DaysInMonth(month.Year, month.Month);

            for (var i = 0; i < MonthlyTemplate.Length; i++)
            {
                var (description, categoryId, baseAmount, method, day) = MonthlyTemplate[i];
                var date = month.AddDays(Math.Min(day, daysInMonth) - 1);
                if (date > today) continue; // No generar gastos futuros.

                // Variación entre -10 % y +15 % según el mes, para que la tendencia no sea plana.
                var factor = 1m + ((monthsAgo * 7 + i * 3) % 26 - 10) / 100m;
                var amount = baseAmount is 180_000m ? baseAmount : Math.Round(baseAmount * factor / 50) * 50;
                var createdAt = date.ToDateTime(new TimeOnly(12, 0), DateTimeKind.Utc);

                yield return Expense.Create(
                    $"seed-{month:yyyyMM}-{i + 1:00}",
                    new ExpenseData(amount, description, categoryId, date, method),
                    createdAt).Value;
            }
        }
    }
}
