using System.Net;
using System.Text;
using MarketPulse.Api.Clients;
using MarketPulse.Api.Exceptions;
using Microsoft.Extensions.Logging.Abstractions;

namespace MarketPulse.Api.Tests.Clients;

public sealed class YahooFinanceClientTests
{
    [Fact]
    public async Task GetIntradayDataAsync_WhenChartErrorIndicatesUnknownSymbol_ThrowsStockNotFoundException()
    {
        var client = CreateClient(
            """
            {
              "chart": {
                "result": null,
                "error": {
                  "code": "Not Found",
                  "description": "No data found, symbol may be delisted"
                }
              }
            }
            """);

        await Assert.ThrowsAsync<StockNotFoundException>(
            () => client.GetIntradayDataAsync(
                "UNKNOWN",
                CancellationToken.None));
    }

    [Fact]
    public async Task GetIntradayDataAsync_WhenChartErrorIndicatesProviderFailure_ThrowsUpstreamServiceException()
    {
        var client = CreateClient(
            """
            {
              "chart": {
                "result": null,
                "error": {
                  "code": "Internal Server Error",
                  "description": "Yahoo Finance service is temporarily unavailable"
                }
              }
            }
            """);

        await Assert.ThrowsAsync<UpstreamServiceException>(
            () => client.GetIntradayDataAsync(
                "AAPL",
                CancellationToken.None));
    }

    private static YahooFinanceClient CreateClient(string responseJson)
    {
        var httpClient = new HttpClient(
            new StubHttpMessageHandler(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        responseJson,
                        Encoding.UTF8,
                        "application/json")
                }))
        {
            BaseAddress = new Uri("https://query1.finance.yahoo.com")
        };

        return new YahooFinanceClient(
            httpClient,
            NullLogger<YahooFinanceClient>.Instance);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;

        public StubHttpMessageHandler(HttpResponseMessage response)
        {
            _response = response;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(_response);
        }
    }
}
