using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using MarketPulse.Api.Clients;
using MarketPulse.Api.Models;
using Microsoft.Extensions.Logging;

namespace MarketPulse.Api.Services;

public sealed class StockMarketService : IStockMarketService
{
    private readonly IStockMarketClient _client;
    private readonly ILogger<StockMarketService>? _logger;

    public StockMarketService(
        IStockMarketClient client,
        ILogger<StockMarketService>? logger = null)
    {
        _client = client;
        _logger = logger;
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
        catch (Exception exception)
        {
            _logger?.LogWarning(
                exception,
                "Unable to resolve exchange timezone {ExchangeTimeZone}; falling back to UTC.",
                data.ExchangeTimeZone);

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
                var lowAvg = lows.Length == 0
                    ? (decimal?)null
                    : lows.Average();
                var highAvg = highs.Length == 0
                    ? (decimal?)null
                    : highs.Average();
                return new DailyStockSummaryDto(
                    DateOnly.FromDateTime(g.Key),
                    RoundPrice(lowAvg),
                    RoundPrice(highAvg),
                    volume);
            })
            .OrderBy(s => s.Day)
            .ToArray();

        return grouped;
    }

    private static decimal? RoundPrice(decimal? price)
    {
        return price.HasValue
            ? decimal.Round(price.Value, 4, MidpointRounding.AwayFromZero)
            : null;
    }
}
