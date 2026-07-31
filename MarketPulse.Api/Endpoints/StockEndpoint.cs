using MarketPulse.Api.Models;
using MarketPulse.Api.Services;
using MarketPulse.Api.Validation;

namespace MarketPulse.Api.Endpoints;

public static class StockEndpoints
{
    public static IEndpointRouteBuilder MapStockEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var stocks = endpoints
            .MapGroup("/api/stocks")
            .WithTags("Stocks");

        stocks.MapGet(
                "/{symbol}/intraday",
                GetIntradaySummaryAsync)
            .WithName("GetIntradayStockSummary")
            .WithSummary("Returns aggregated daily stock data")
            .Produces<IReadOnlyList<DailyStockSummaryDto>>(
                StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .ProducesProblem(StatusCodes.Status504GatewayTimeout)
            .ProducesProblem(StatusCodes.Status500InternalServerError);

        return endpoints;
    }

    private static async Task<IResult> GetIntradaySummaryAsync(
        string symbol,
        IStockMarketService stockMarketService,
        CancellationToken cancellationToken)
    {
        if (!StockSymbolValidator.TryNormalize(
                symbol,
                out var normalizedSymbol))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid stock symbol",
                detail:
                    "Use 1–10 letters, numbers, periods, or hyphens.");
        }

        var results = await stockMarketService.GetDailySummaryAsync(
            normalizedSymbol,
            cancellationToken);

        return Results.Ok(results);
    }
}
