using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MarketPulse.Api.Exceptions;
using MarketPulse.Api.Models;
using MarketPulse.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MarketPulse.Api.Tests.Endpoints;

public sealed class StockEndpointIntegrationTests
{
    [Fact]
    public async Task GetIntradaySummary_WithValidSymbol_ReturnsOk()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/AAPL/intraday");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetIntradaySummary_WithLowercaseSymbol_NormalizesSymbolBeforeCallingService()
    {
        var service = new TestStockMarketService();
        using var factory = CreateFactory(service);
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/aapl/intraday");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("AAPL", Assert.Single(service.ReceivedSymbols));
    }

    [Fact]
    public async Task GetIntradaySummary_WithMalformedSymbol_ReturnsBadRequestProblemDetails()
    {
        var service = new TestStockMarketService();
        using var factory = CreateFactory(service);
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/AAPL%24/intraday");

        var problem = await AssertProblemDetailsAsync(
            response,
            HttpStatusCode.BadRequest);

        Assert.Equal("Invalid stock symbol", problem.Title);
        Assert.Empty(service.ReceivedSymbols);
    }

    [Fact]
    public async Task GetIntradaySummary_WithMissingDataSymbol_ReturnsNotFoundProblemDetails()
    {
        using var factory = CreateFactory(
            TestStockMarketService.Throwing(
                symbol => new StockNotFoundException(symbol)));
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/MISSING/intraday");

        var problem = await AssertProblemDetailsAsync(
            response,
            HttpStatusCode.NotFound);

        Assert.Equal("Stock data not found", problem.Title);
    }

    [Fact]
    public async Task GetIntradaySummary_WhenProviderFails_ReturnsBadGatewayProblemDetails()
    {
        using var factory = CreateFactory(
            TestStockMarketService.Throwing(
                _ => new UpstreamServiceException("Provider failed.")));
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/AAPL/intraday");

        var problem = await AssertProblemDetailsAsync(
            response,
            HttpStatusCode.BadGateway);

        Assert.Equal("Stock provider error", problem.Title);
    }

    [Fact]
    public async Task GetIntradaySummary_WhenProviderTimesOut_ReturnsGatewayTimeoutProblemDetails()
    {
        using var factory = CreateFactory(
            TestStockMarketService.Throwing(
                _ => new UpstreamTimeoutException("Provider timed out.")));
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/AAPL/intraday");

        var problem = await AssertProblemDetailsAsync(
            response,
            HttpStatusCode.GatewayTimeout);

        Assert.Equal("Stock provider timeout", problem.Title);
    }

    [Fact]
    public async Task GetIntradaySummary_WithSuccessfulResponse_MatchesRequiredJsonContract()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/stocks/AAPL/intraday");

        response.EnsureSuccessStatusCode();
        await using var contentStream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(contentStream);

        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);

        var item = Assert.Single(document.RootElement.EnumerateArray());
        var propertyNames = item
            .EnumerateObject()
            .Select(property => property.Name)
            .OrderBy(name => name)
            .ToArray();

        Assert.Equal(
            ["day", "highAverage", "lowAverage", "volume"],
            propertyNames);
        Assert.Equal("2009-01-30", item.GetProperty("day").GetString());
        Assert.Equal(40.2958m, item.GetProperty("lowAverage").GetDecimal());
        Assert.Equal(49.7534m, item.GetProperty("highAverage").GetDecimal());
        Assert.Equal(49073348, item.GetProperty("volume").GetInt64());
    }

    private static MarketPulseApiFactory CreateFactory(
        TestStockMarketService? service = null)
    {
        return new MarketPulseApiFactory(
            service ?? TestStockMarketService.Returning(
            [
                new DailyStockSummaryDto(
                    new DateOnly(2009, 1, 30),
                    40.2958m,
                    49.7534m,
                    49073348)
            ]));
    }

    private static HttpClient CreateClient(WebApplicationFactory<Program> factory)
    {
        return factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
    }

    private static async Task<ProblemDetails> AssertProblemDetailsAsync(
        HttpResponseMessage response,
        HttpStatusCode expectedStatusCode)
    {
        Assert.Equal(expectedStatusCode, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.NotNull(problem);
        Assert.Equal((int)expectedStatusCode, problem!.Status);
        Assert.False(string.IsNullOrWhiteSpace(problem.Title));

        return problem;
    }

    private sealed class MarketPulseApiFactory : WebApplicationFactory<Program>
    {
        private readonly TestStockMarketService _service;

        public MarketPulseApiFactory(TestStockMarketService service)
        {
            _service = service;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IStockMarketService>();
                services.AddSingleton<IStockMarketService>(_service);
            });
        }
    }

    private sealed class TestStockMarketService : IStockMarketService
    {
        private readonly Func<string, CancellationToken, Task<IReadOnlyList<DailyStockSummaryDto>>> _handler;

        private TestStockMarketService(
            Func<string, CancellationToken, Task<IReadOnlyList<DailyStockSummaryDto>>> handler)
        {
            _handler = handler;
        }

        public TestStockMarketService()
            : this((_, _) => Task.FromResult<IReadOnlyList<DailyStockSummaryDto>>(
                Array.Empty<DailyStockSummaryDto>()))
        {
        }

        public List<string> ReceivedSymbols { get; } = [];

        public static TestStockMarketService Returning(
            IReadOnlyList<DailyStockSummaryDto> results)
        {
            return new TestStockMarketService(
                (_, _) => Task.FromResult(results));
        }

        public static TestStockMarketService Throwing(
            Func<string, Exception> exceptionFactory)
        {
            return new TestStockMarketService(
                (symbol, _) => Task.FromException<IReadOnlyList<DailyStockSummaryDto>>(
                    exceptionFactory(symbol)));
        }

        public Task<IReadOnlyList<DailyStockSummaryDto>> GetDailySummaryAsync(
            string symbol,
            CancellationToken cancellationToken)
        {
            ReceivedSymbols.Add(symbol);

            return _handler(symbol, cancellationToken);
        }
    }
}
