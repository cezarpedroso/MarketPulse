using System.Text.Json.Serialization;

namespace MarketPulse.Api.Models.Yahoo;

public sealed class YahooChartResponse
{
    [JsonPropertyName("chart")]
    public YahooChart? Chart { get; init; }
}

public sealed class YahooChart
{
    [JsonPropertyName("result")]
    public List<YahooChartResult>? Result { get; init; }

    [JsonPropertyName("error")]
    public YahooChartError? Error { get; init; }
}

public sealed class YahooChartResult
{
    [JsonPropertyName("meta")]
    public YahooChartMeta? Meta { get; init; }

    [JsonPropertyName("timestamp")]
    public List<long>? Timestamp { get; init; }

    [JsonPropertyName("indicators")]
    public YahooIndicators? Indicators { get; init; }
}

public sealed class YahooChartMeta
{
    [JsonPropertyName("exchangeTimezoneName")]
    public string? ExchangeTimezoneName { get; init; }
}

public sealed class YahooIndicators
{
    [JsonPropertyName("quote")]
    public List<YahooQuote>? Quote { get; init; }
}

public sealed class YahooQuote
{
    [JsonPropertyName("low")]
    public List<decimal?>? Low { get; init; }

    [JsonPropertyName("high")]
    public List<decimal?>? High { get; init; }

    [JsonPropertyName("volume")]
    public List<long?>? Volume { get; init; }
}

public sealed class YahooChartError
{
    [JsonPropertyName("code")]
    public string? Code { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }
}