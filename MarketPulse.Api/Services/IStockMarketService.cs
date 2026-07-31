using MarketPulse.Api.Models;

namespace MarketPulse.Api.Services;

public interface IStockMarketService
{
    Task<IReadOnlyList<DailyStockSummaryDto>> GetDailySummaryAsync(
        string symbol,
        CancellationToken cancellationToken);
}