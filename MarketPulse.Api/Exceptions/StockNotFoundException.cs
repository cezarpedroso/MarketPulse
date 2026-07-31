namespace MarketPulse.Api.Exceptions;

public sealed class StockNotFoundException(string symbol)
    : Exception($"No market data was found for symbol {symbol}.");