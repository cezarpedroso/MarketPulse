namespace MarketPulse.Api.Configuration;

public sealed class YahooFinanceOptions
{
    public string? BaseUrl { get; set; } = "https://query1.finance.yahoo.com";
    public int TimeoutSeconds { get; set; } = 15;
}
