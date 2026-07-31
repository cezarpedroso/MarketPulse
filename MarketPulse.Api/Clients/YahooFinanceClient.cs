using MarketPulse.Api.Clients;
using System.Net;
using System.Net.Http.Json;
using MarketPulse.Api.Exceptions;
using MarketPulse.Api.Models;
using MarketPulse.Api.Models.Yahoo;
using MarketPulse.Api.Models;

namespace MarketPulse.Api.Clients;

public sealed class YahooFinanceClient(
    HttpClient httpClient,
    ILogger<YahooFinanceClient> logger)
    : IStockMarketClient
{
    public async Task<IntradayStockData> GetIntradayDataAsync(
        string symbol,
        CancellationToken cancellationToken)
    {
        var requestUri =
            $"/v8/finance/chart/{Uri.EscapeDataString(symbol)}" +
            "?range=1mo" +
            "&interval=15m" +
            "&includePrePost=false";

        HttpResponseMessage response;

        try
        {
            response = await httpClient.GetAsync(
                requestUri,
                cancellationToken);
        }
        catch (TaskCanceledException)
            when (!cancellationToken.IsCancellationRequested)
        {
            throw new UpstreamTimeoutException(
                "The stock-data provider did not respond in time.");
        }

        using (response)
        {
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                throw new StockNotFoundException(symbol);
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Yahoo Finance returned {StatusCode} for {Symbol}",
                    response.StatusCode,
                    symbol);

                throw new UpstreamServiceException(
                    "The stock-data provider returned an error.");
            }

            YahooChartResponse? payload;

            try
            {
                payload = await response.Content
                    .ReadFromJsonAsync<YahooChartResponse>(
                        cancellationToken: cancellationToken);
            }
            catch (Exception exception)
                when (exception is not OperationCanceledException)
            {
                logger.LogError(
                    exception,
                    "Yahoo Finance returned invalid JSON for {Symbol}",
                    symbol);

                throw new UpstreamServiceException(
                    "The stock-data provider returned an invalid response.");
            }

            if (payload?.Chart?.Error is not null)
            {
                throw new StockNotFoundException(symbol);
            }

            var result = payload?.Chart?.Result?.FirstOrDefault();
            var quote = result?.Indicators?.Quote?.FirstOrDefault();

            if (result is null ||
                quote is null ||
                result.Timestamp is null ||
                result.Timestamp.Count == 0)
            {
                throw new StockNotFoundException(symbol);
            }

            var lows = quote.Low ?? [];
            var highs = quote.High ?? [];
            var volumes = quote.Volume ?? [];
            var timestamps = result.Timestamp;

            var count = new[]
            {
                timestamps.Count,
                lows.Count,
                highs.Count,
                volumes.Count
            }.Min();

            if (count == 0)
            {
                throw new StockNotFoundException(symbol);
            }

            var points = new List<IntradayStockPoint>(count);

            for (var index = 0; index < count; index++)
            {
                points.Add(new IntradayStockPoint(
                    DateTimeOffset.FromUnixTimeSeconds(timestamps[index]),
                    lows[index],
                    highs[index],
                    volumes[index]));
            }

            List<IntradayStockPoint> points1 = points;
            return new IntradayStockData(
                points1,
                result.Meta?.ExchangeTimezoneName ?? "UTC");
        }
    }
}