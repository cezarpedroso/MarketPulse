namespace MarketPulse.Api.Exceptions;

public sealed class UpstreamTimeoutException(string message)
    : Exception(message);