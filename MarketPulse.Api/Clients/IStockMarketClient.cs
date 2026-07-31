using MarketPulse.Api.Models;

namespace MarketPulse.Api.Clients;

public interface IStockMarketClient
{
    Task<IntradayStockData> GetIntradayDataAsync(
        string symbol,
        CancellationToken cancellationToken);
}