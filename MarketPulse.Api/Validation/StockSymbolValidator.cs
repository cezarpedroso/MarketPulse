using System.Text.RegularExpressions;

namespace MarketPulse.Api.Validation;

public static partial class StockSymbolValidator
{
    [GeneratedRegex(@"^[A-Z0-9.-]{1,10}$")]
    private static partial Regex ValidSymbolPattern();

    public static bool TryNormalize(
        string? input,
        out string normalizedSymbol)
    {
        normalizedSymbol = input?.Trim().ToUpperInvariant() ?? string.Empty;

        return ValidSymbolPattern().IsMatch(normalizedSymbol);
    }
}