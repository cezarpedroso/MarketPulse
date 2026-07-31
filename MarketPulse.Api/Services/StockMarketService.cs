using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using MarketPulse.Api.Clients;
using MarketPulse.Api.Models;

namespace MarketPulse.Api.Services;

public sealed class StockMarketService : IStockMarketService
{
    private readonly IStockMarketClient _client;

    public StockMarketService(IStockMarketClient client)
    {
        _client = client;
    }

    public async Task<IReadOnlyList<DailyStockSummaryDto>> GetDailySummaryAsync(
        string symbol,
        CancellationToken cancellationToken)
    {
        var data = await _client.GetIntradayDataAsync(symbol, cancellationToken);

        if (data?.Points == null || data.Points.Count == 0)
            return Array.Empty<DailyStockSummaryDto>();

        TimeZoneInfo tzInfo;
        try
        {
            tzInfo = TimeZoneInfo.FindSystemTimeZoneById(data.ExchangeTimeZone);
        }
        catch
        {
            tzInfo = TimeZoneInfo.Utc;
        }

        var grouped = data.Points
            .Select(p => new { Date = TimeZoneInfo.ConvertTime(p.Timestamp, tzInfo).Date, p.Low, p.High, p.Volume })
            .GroupBy(x => x.Date)
            .Select(g =>
            {
                var lows = g.Where(i => i.Low.HasValue).Select(i => i.Low!.Value).ToArray();
                var highs = g.Where(i => i.High.HasValue).Select(i => i.High!.Value).ToArray();
                var volume = g.Where(i => i.Volume.HasValue).Sum(i => i.Volume!.Value);
                var lowAvg = lows.Length == 0 ? 0m : lows.Average();
                var highAvg = highs.Length == 0 ? 0m : highs.Average();
                return new DailyStockSummaryDto(DateOnly.FromDateTime(g.Key), lowAvg, highAvg, volume);
            })
            .OrderBy(s => s.Day)
            .ToArray();

        return grouped;
    }
}
