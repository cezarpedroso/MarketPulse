namespace MarketPulse.Api.Models;

public sealed record IntradayStockPoint(
    DateTimeOffset Timestamp,
    decimal? Low,
    decimal? High,
    long? Volume);