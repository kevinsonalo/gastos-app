using Gastos.Application.Abstractions;

namespace Gastos.Infrastructure.Services;

internal sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}

internal sealed class GuidIdGenerator : IIdGenerator
{
    public string NewId() => Guid.NewGuid().ToString();
}
