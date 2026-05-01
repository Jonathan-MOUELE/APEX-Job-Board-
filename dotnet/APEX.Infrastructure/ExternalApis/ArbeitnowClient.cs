// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — ArbeitnowClient                      ║
// ║  Jobs EU + Remote, gratuit, sans clé (CORS Yes)             ║
// ╚══════════════════════════════════════════════════════════════╝
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using APEX.Core;

namespace APEX.Infrastructure.ExternalApis;

public class ArbeitnowClient(IHttpClientFactory httpFactory, ILogger<ArbeitnowClient> logger)
{
    private const string BaseUrl = "https://www.arbeitnow.com/api/job-board-api";

    public async Task<List<JobOffer>> SearchAsync(string keywords, string? location = null, CancellationToken ct = default)
    {
        try
        {
            var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("APEX-JobBot/1.0");

            var url = $"{BaseUrl}?search={Uri.EscapeDataString(keywords)}";
            if (!string.IsNullOrWhiteSpace(location))
                url += $"&location={Uri.EscapeDataString(location)}";

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(8));

            var response = await client.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("[ARBEITNOW] HTTP {Status}", response.StatusCode);
                return [];
            }

            var root = await response.Content.ReadFromJsonAsync<ArbeitnowResponse>(cancellationToken: ct);
            if (root?.Data is null) return [];

            return root.Data
                .Take(20)
                .Select(j => new JobOffer(
                    Id: $"AN_{j.Slug ?? Guid.NewGuid().ToString()}",
                    Title: j.Title ?? "",
                    Company: j.CompanyName ?? "",
                    CompanyLogoUrl: j.CompanyLogoUrl,
                    Location: j.Location ?? "Remote",
                    PostalCode: null,
                    ContractType: j.JobTypes?.FirstOrDefault() ?? "CDI",
                    ExperienceRequired: null,
                    Description: j.Description ?? "",
                    RequiredTechs: [],
                    NiceToHaveTechs: [],
                    RequiredSoftSkills: [],
                    Trainings: [],
                    SalaryLabel: null,
                    SalaryMin: null,
                    SalaryMax: null,
                    DateCreated: DateTime.UtcNow,
                    OriginUrl: j.Url,
                    Source: "EU/Remote"
                ))
                .ToList();
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("[ARBEITNOW] Request timed out");
            return [];
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[ARBEITNOW] Failed silently");
            return [];
        }
    }

    // DTOs
    private record ArbeitnowResponse(List<ArbeitnowJob>? Data);
    private record ArbeitnowJob(
        string? Title,
        string? Slug,
        string? CompanyName,
        string? CompanyLogoUrl,
        string? Location,
        string? Description,
        string? Url,
        List<string>? JobTypes);
}
