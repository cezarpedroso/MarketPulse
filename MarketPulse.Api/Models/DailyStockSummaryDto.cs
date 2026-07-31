namespace MarketPulse.Api.Models;

public sealed record DailyStockSummaryDto(
    DateOnly Day,
    decimal? LowAverage,
    decimal? HighAverage,
    long Volume);
