using MarketPulse.Api.Clients;
using MarketPulse.Api.Configuration;
using MarketPulse.Api.Endpoints;
using MarketPulse.Api.Exceptions;
using MarketPulse.Api.Services;
using Microsoft.Extensions.Options;

const string ReactDevelopmentCorsPolicy = "ReactDevelopment";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        ReactDevelopmentCorsPolicy,
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

builder.Services.AddScoped<
    IStockMarketService,
    StockMarketService>();

builder.Services.Configure<YahooFinanceOptions>(
    builder.Configuration.GetSection("YahooFinance"));

builder.Services.AddHttpClient<
    IStockMarketClient,
    YahooFinanceClient>((sp, client) =>
    {
        var opts = sp.GetRequiredService<IOptions<YahooFinanceOptions>>().Value;

        client.BaseAddress = new Uri(
            opts.BaseUrl ?? "https://query1.finance.yahoo.com");

        client.Timeout = TimeSpan.FromSeconds(
            opts.TimeoutSeconds > 0 ? opts.TimeoutSeconds : 15);

        client.DefaultRequestHeaders.UserAgent.ParseAdd(
            "Mozilla/5.0 MarketPulsePractice/1.0");
    });

var app = builder.Build();

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exception = context.Features
            .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()
            ?.Error;

        var statusCode = exception switch
        {
            StockNotFoundException =>
                StatusCodes.Status404NotFound,

            UpstreamTimeoutException =>
                StatusCodes.Status504GatewayTimeout,

            UpstreamServiceException =>
                StatusCodes.Status502BadGateway,

            _ =>
                StatusCodes.Status500InternalServerError
        };

        var title = statusCode switch
        {
            StatusCodes.Status404NotFound =>
                "Stock data not found",

            StatusCodes.Status502BadGateway =>
                "Stock provider error",

            StatusCodes.Status504GatewayTimeout =>
                "Stock provider timeout",

            _ =>
                "Unexpected server error"
        };

        var detail = exception is StockNotFoundException
            ? exception.Message
            : "The request could not be completed.";

        await Results.Problem(
            statusCode: statusCode,
            title: title,
            detail: detail)
            .ExecuteAsync(context);
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(ReactDevelopmentCorsPolicy);

app.MapStockEndpoints();

app.MapGet(
        "/health",
        () => Results.Ok(new
        {
            status = "healthy",
            timestamp = DateTimeOffset.UtcNow
        }))
    .WithTags("Health");

app.Run();

public partial class Program
{
}
