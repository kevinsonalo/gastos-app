using System.Globalization;

namespace Gastos.Application.Expenses;

/// <summary>Convierte un mes "YYYY-MM" en el rango de fechas [primer día, último día].</summary>
public static class MonthRange
{
    public static bool TryParse(string month, out (DateOnly From, DateOnly To) range)
    {
        range = default;
        if (!DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first))
            return false;

        range = (first, first.AddMonths(1).AddDays(-1));
        return true;
    }
}
