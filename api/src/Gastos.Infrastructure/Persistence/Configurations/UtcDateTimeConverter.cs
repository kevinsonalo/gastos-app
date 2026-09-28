using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Gastos.Infrastructure.Persistence.Configurations;

/// <summary>
/// SQLite no guarda el "Kind" de un DateTime: al leerlo se marca como UTC para que
/// la API lo serialice con sufijo "Z" (ISO-8601), igual que el frontend.
/// </summary>
internal sealed class UtcDateTimeConverter()
    : ValueConverter<DateTime, DateTime>(v => v.ToUniversalTime(), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
