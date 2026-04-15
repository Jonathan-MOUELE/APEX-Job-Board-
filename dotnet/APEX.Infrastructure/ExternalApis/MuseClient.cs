// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — MuseClient                           ║
// ║  The Muse — Profils entreprise (culture, taille, url)       ║
// ║  API gratuite, clé optionnelle, appel CÔTÉ SERVEUR only     ║
// ╚══════════════════════════════════════════════════════════════╝
using System.Collections.Concurrent;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace APEX.Infrastructure.ExternalApis;

public record MuseCompany(string Name, string? Description, string? Size, string? Url, string? LogoUrl, DateTime CachedAt);

public class MuseClient(IHttpClientFactory httpFactory, ILogger<MuseClient> logger)
{
    private const string BaseUrl = "https://www.themuse.com/api/public/companies";

    // In-memory cache: 1h per company name
    private static readonly ConcurrentDictionary<string, MuseCompany> _cache = new(StringComparer.OrdinalIgnoreCase);

    public async Task<MuseCompany?> GetCompanyAsync(string companyName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(companyName)) return null;

        // Evict stale entries periodically to prevent unbounded cache growth
        if (_cache.Count > 500)
        {
            var staleKeys = _cache
                .Where(kv => DateTime.UtcNow - kv.Value.CachedAt >= TimeSpan.FromHours(1))
                .Select(kv => kv.Key)
                .ToList();
            foreach (var key in staleKeys) _cache.TryRemove(key, out _);
        }

        // Check cache first
        if (_cache.TryGetValue(companyName, out var cached) &&
            DateTime.UtcNow - cached.CachedAt < TimeSpan.FromHours(1))
            return cached;

        try
        {
            var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(2);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("APEX-JobBot/1.0");

            var url = $"{BaseUrl}?name={Uri.EscapeDataString(companyName)}&page=1&page_size=1";

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(2));

            var root = await client.GetFromJsonAsync<MuseResponse>(url, cts.Token);
            var comp = root?.Results?.FirstOrDefault();
            if (comp is null) return null;

            // Validate URL is HTTPS to prevent javascript: XSS if upstream data is compromised
            var safeUrl = comp.Url is not null &&
                          Uri.TryCreate(comp.Url, UriKind.Absolute, out var parsedUrl) &&
                          (parsedUrl.Scheme == Uri.UriSchemeHttps || parsedUrl.Scheme == Uri.UriSchemeHttp)
                          ? comp.Url : null;

            var result = new MuseCompany(
                Name: comp.Name ?? companyName,
                Description: comp.Description,
                Size: comp.Size,
                Url: safeUrl,
                LogoUrl: comp.Logo?.ThumbUrl,
                CachedAt: DateTime.UtcNow
            );

            _cache[companyName] = result;
            return result;
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("[MUSE] Request timed out for: {Company}", companyName);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[MUSE] Failed silently for: {Company}", companyName);
            return null;
        }
    }

    // DTOs
    private record MuseResponse(List<MuseResult>? Results);
    private record MuseResult(string? Name, string? Description, string? Size, string? Url, MuseLogo? Logo);
    private record MuseLogo(string? ThumbUrl);
}
