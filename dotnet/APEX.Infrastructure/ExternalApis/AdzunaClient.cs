// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — AdzunaClient                         ║
// ║  Adzuna Job Search API v1 — France + international          ║
// ║  Doc: https://developer.adzuna.com/activedocs               ║
// ╚══════════════════════════════════════════════════════════════╝
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using APEX.Core;

namespace APEX.Infrastructure.ExternalApis;

public class AdzunaOptions
{
    public const string SectionName = "Adzuna";
    public string AppId  { get; init; } = "";
    public string AppKey { get; init; } = "";
    /// <summary>ISO country code: fr, gb, us, de, au…</summary>
    public string Country { get; init; } = "fr";
}

public class AdzunaClient(
    IHttpClientFactory httpFactory,
    IOptions<AdzunaOptions> options,
    ILogger<AdzunaClient> logger)
{
    private const string BaseUrl = "https://api.adzuna.com/v1/api/jobs";

    public async Task<List<JobOffer>> SearchAsync(
        string keywords,
        string? location = null,
        string  country  = "fr",
        CancellationToken ct = default)
    {
        var opts = options.Value;
        // Logic will use the 'country' parameter instead of opts.Country if provided
        var targetCountry = string.IsNullOrWhiteSpace(country) ? opts.Country : country;
        if (string.IsNullOrWhiteSpace(opts.AppId) || string.IsNullOrWhiteSpace(opts.AppKey)
            || opts.AppId == "REPLACE_ME")
        {
            logger.LogDebug("[ADZUNA] Clé non configurée — source ignorée.");
            return [];
        }

        try
        {
            var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("APEX-JobBot/1.0");

            // Build URL: GET /{country}/search/1?app_id=&app_key=&what=&where=&results_per_page=20
            var qs = new System.Text.StringBuilder();
            qs.Append($"?app_id={Uri.EscapeDataString(opts.AppId)}");
            qs.Append($"&app_key={Uri.EscapeDataString(opts.AppKey)}");
            qs.Append($"&what={Uri.EscapeDataString(keywords)}");
            if (!string.IsNullOrWhiteSpace(location))
                qs.Append($"&where={Uri.EscapeDataString(location)}");
            qs.Append("&results_per_page=20");
            qs.Append("&content-type=application/json");

            var url = $"{BaseUrl}/{targetCountry}/search/1{qs}";
            logger.LogInformation("[ADZUNA] Request: {Url}", url);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var response = await client.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("[ADZUNA] HTTP {Status}", response.StatusCode);
                return [];
            }

            var bytes = await response.Content.ReadAsByteArrayAsync(ct);
            var body  = System.Text.Encoding.UTF8.GetString(bytes);
            var root  = System.Text.Json.JsonSerializer.Deserialize<AdzunaResponse>(body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (root?.Results is null) return [];

            return root.Results.Select(j => new JobOffer(
                Id:                 $"ADZ_{j.Id}",
                Title:              j.Title ?? "",
                Company:            j.Company?.DisplayName ?? "",
                CompanyLogoUrl:     null,
                Location:           j.Location?.DisplayName ?? location ?? "",
                PostalCode:         null,
                ContractType:       j.ContractType ?? j.ContractTime ?? "CDI",
                ExperienceRequired: null,
                Description:        j.Description ?? "",
                RequiredTechs:      [],
                NiceToHaveTechs:    [],
                RequiredSoftSkills: [],
                Trainings:          [],
                SalaryLabel:        BuildSalaryLabel(j.SalaryMin, j.SalaryMax),
                SalaryMin:          j.SalaryMin.HasValue ? (decimal)j.SalaryMin.Value : null,
                SalaryMax:          j.SalaryMax.HasValue ? (decimal)j.SalaryMax.Value : null,
                DateCreated:        j.Created ?? DateTime.UtcNow,
                OriginUrl:          j.RedirectUrl,
                Source:             "Adzuna"
            )).ToList();
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("[ADZUNA] Timeout");
            return [];
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[ADZUNA] Échec silencieux");
            return [];
        }
    }

    private static string? BuildSalaryLabel(double? min, double? max) =>
        (min, max) switch
        {
            (double mn, double mx) => $"{mn:N0} – {mx:N0} €/an",
            (double mn, null)      => $"À partir de {mn:N0} €/an",
            (null, double mx)      => $"Jusqu'à {mx:N0} €/an",
            _                      => null
        };

    // ── DTOs ──────────────────────────────────────────────────────

    private record AdzunaResponse(
        [property: JsonPropertyName("results")] List<AdzunaJob>? Results);

    private record AdzunaJob(
        [property: JsonPropertyName("id")]           string? Id,
        [property: JsonPropertyName("title")]        string? Title,
        [property: JsonPropertyName("description")]  string? Description,
        [property: JsonPropertyName("redirect_url")] string? RedirectUrl,
        [property: JsonPropertyName("created")]      DateTime? Created,
        [property: JsonPropertyName("salary_min")]   double? SalaryMin,
        [property: JsonPropertyName("salary_max")]   double? SalaryMax,
        [property: JsonPropertyName("contract_type")]string? ContractType,
        [property: JsonPropertyName("contract_time")]string? ContractTime,
        [property: JsonPropertyName("company")]      AdzunaCompany? Company,
        [property: JsonPropertyName("location")]     AdzunaLocation? Location);

    private record AdzunaCompany(
        [property: JsonPropertyName("display_name")] string? DisplayName);

    private record AdzunaLocation(
        [property: JsonPropertyName("display_name")] string? DisplayName);
}
