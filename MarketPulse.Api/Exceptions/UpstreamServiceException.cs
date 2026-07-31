namespace MarketPulse.Api.Exceptions;

public sealed class UpstreamServiceException(string message)
    : Exception(message);