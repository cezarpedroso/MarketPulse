using MarketPulse.Api.Clients;
using MarketPulse.Api.Models;
using MarketPulse.Api.Services;

namespace MarketPulse.Api.Tests.Services;

public sealed class StockMarketServiceTests
{
    [Fact]
    public async Task GetDailySummaryAsync_GroupsMultipleIntradayPointsIntoOneExchangeLocalTradingDay()
    {
        var service = CreateService(
            "America/New_York",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T23:30:00+00:00"),
                10m,
                20m,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-02T01:30:00+00:00"),
                12m,
                22m,
                200));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        var result = Assert.Single(results);
        Assert.Equal(new DateOnly(2026, 7, 1), result.Day);
        Assert.Equal(11m, result.LowAverage);
        Assert.Equal(21m, result.HighAverage);
        Assert.Equal(300, result.Volume);
    }

    [Fact]
    public async Task GetDailySummaryAsync_GroupsPointsIntoMultipleDaysAndReturnsAscendingDateOrder()
    {
        var service = CreateService(
            "UTC",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-03T13:30:00+00:00"),
                30m,
                40m,
                300),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:30:00+00:00"),
                10m,
                20m,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-02T13:30:00+00:00"),
                20m,
                30m,
                200));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        Assert.Collection(
            results,
            first => Assert.Equal(new DateOnly(2026, 7, 1), first.Day),
            second => Assert.Equal(new DateOnly(2026, 7, 2), second.Day),
            third => Assert.Equal(new DateOnly(2026, 7, 3), third.Day));
    }

    [Fact]
    public async Task GetDailySummaryAsync_CalculatesAverageLowAverageHighAndSumsDailyVolume()
    {
        var service = CreateService(
            "UTC",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:30:00+00:00"),
                40m,
                50m,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:45:00+00:00"),
                42m,
                54m,
                250),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T14:00:00+00:00"),
                44m,
                56m,
                650));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        var result = Assert.Single(results);
        Assert.Equal(42m, result.LowAverage);
        Assert.Equal(53.3333m, result.HighAverage);
        Assert.Equal(1000, result.Volume);
    }

    [Fact]
    public async Task GetDailySummaryAsync_IgnoresNullMarketValuesInDailyAggregation()
    {
        var service = CreateService(
            "UTC",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:30:00+00:00"),
                null,
                20m,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:45:00+00:00"),
                10m,
                null,
                null),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T14:00:00+00:00"),
                14m,
                24m,
                200));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        var result = Assert.Single(results);
        Assert.Equal(12m, result.LowAverage);
        Assert.Equal(22m, result.HighAverage);
        Assert.Equal(300, result.Volume);
    }

    [Fact]
    public async Task GetDailySummaryAsync_ReturnsNullAveragesWhenDayHasNoValidLowOrHighValues()
    {
        var service = CreateService(
            "UTC",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:30:00+00:00"),
                null,
                null,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:45:00+00:00"),
                null,
                null,
                200));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        var result = Assert.Single(results);
        Assert.Null(result.LowAverage);
        Assert.Null(result.HighAverage);
        Assert.Equal(300, result.Volume);
    }

    [Fact]
    public async Task GetDailySummaryAsync_UsesExchangeTimezoneForDateBoundary()
    {
        var service = CreateService(
            "America/New_York",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-02T03:30:00+00:00"),
                10m,
                20m,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-02T04:30:00+00:00"),
                12m,
                22m,
                200));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        Assert.Collection(
            results,
            first =>
            {
                Assert.Equal(new DateOnly(2026, 7, 1), first.Day);
                Assert.Equal(100, first.Volume);
            },
            second =>
            {
                Assert.Equal(new DateOnly(2026, 7, 2), second.Day);
                Assert.Equal(200, second.Volume);
            });
    }

    [Fact]
    public async Task GetDailySummaryAsync_RoundsAveragePricesToFourDecimalPlaces()
    {
        var service = CreateService(
            "UTC",
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:30:00+00:00"),
                1.23456m,
                9.87654m,
                100),
            new IntradayStockPoint(
                DateTimeOffset.Parse("2026-07-01T13:45:00+00:00"),
                1.23458m,
                9.87656m,
                100));

        var results = await service.GetDailySummaryAsync(
            "AAPL",
            CancellationToken.None);

        var result = Assert.Single(results);
        Assert.Equal(1.2346m, result.LowAverage);
        Assert.Equal(9.8766m, result.HighAverage);
    }

    private static StockMarketService CreateService(
        string exchangeTimeZone,
        params IntradayStockPoint[] points)
    {
        return new StockMarketService(
            new MockStockMarketClient(
                new IntradayStockData(
                    points,
                    exchangeTimeZone)));
    }

    private sealed class MockStockMarketClient : IStockMarketClient
    {
        private readonly IntradayStockData _data;

        public MockStockMarketClient(IntradayStockData data)
        {
            _data = data;
        }

        public Task<IntradayStockData> GetIntradayDataAsync(
            string symbol,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(_data);
        }
    }
}
