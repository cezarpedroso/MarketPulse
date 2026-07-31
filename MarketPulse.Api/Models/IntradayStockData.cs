namespace MarketPulse.Api.Models;

public sealed record IntradayStockData(
    IReadOnlyList<IntradayStockPoint> Points,
    string ExchangeTimeZone);