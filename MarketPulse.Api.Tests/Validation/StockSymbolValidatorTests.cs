using MarketPulse.Api.Validation;

namespace MarketPulse.Api.Tests.Validation;

public sealed class StockSymbolValidatorTests
{
    [Theory]
    [InlineData("AAPL", "AAPL")]
    [InlineData("BRK.B", "BRK.B")]
    [InlineData("BF-B", "BF-B")]
    public void TryNormalize_AcceptsSupportedSymbols(
        string input,
        string expected)
    {
        var isValid = StockSymbolValidator.TryNormalize(
            input,
            out var normalizedSymbol);

        Assert.True(isValid);
        Assert.Equal(expected, normalizedSymbol);
    }

    [Fact]
    public void TryNormalize_TrimsSurroundingWhitespace()
    {
        var isValid = StockSymbolValidator.TryNormalize(
            "  AAPL  ",
            out var normalizedSymbol);

        Assert.True(isValid);
        Assert.Equal("AAPL", normalizedSymbol);
    }

    [Fact]
    public void TryNormalize_NormalizesLowercaseInputToUppercase()
    {
        var isValid = StockSymbolValidator.TryNormalize(
            "brk.b",
            out var normalizedSymbol);

        Assert.True(isValid);
        Assert.Equal("BRK.B", normalizedSymbol);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void TryNormalize_RejectsEmptyInput(string input)
    {
        var isValid = StockSymbolValidator.TryNormalize(
            input,
            out var normalizedSymbol);

        Assert.False(isValid);
        Assert.Equal(string.Empty, normalizedSymbol);
    }

    [Theory]
    [InlineData("AAPL$")]
    [InlineData("BRK/B")]
    [InlineData("MS FT")]
    public void TryNormalize_RejectsUnsupportedCharacters(string input)
    {
        var isValid = StockSymbolValidator.TryNormalize(
            input,
            out _);

        Assert.False(isValid);
    }

    [Fact]
    public void TryNormalize_RejectsSymbolsLongerThanTenCharacters()
    {
        var isValid = StockSymbolValidator.TryNormalize(
            "ABCDEFGHIJK",
            out _);

        Assert.False(isValid);
    }
}
