// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — FranceTravailClient V1 Production     ║
// ║  OAuth2 Client Credentials + INSEE lookup + Bulletproof      ║
// ╚══════════════════════════════════════════════════════════════╝

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using APEX.Core;

namespace APEX.Infrastructure;

/// <summary>
/// Client France Travail V2 — thread-safe, SemaphoreSlim token cache,
/// INSEE lookup via geo.api.gouv.fr, departement fallback, error handling 400/401/429/500.
/// </summary>
public sealed class FranceTravailClient(
    IHttpClientFactory httpFactory,
    IOptions<FranceTravailOptions> options,
    ILogger<FranceTravailClient> logger) : IJobService
{
    private readonly FranceTravailOptions _opts = options.Value;

    // ── Thread-safe token cache ─────────────────────────────────
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    // ── Cache des derniers résultats (fallback 429/500) ─────────
    private IReadOnlyList<JobOffer> _lastResults = [];

    // ── Cache INSEE & Départements ──────────────────────────────
    private readonly Dictionary<string, string> _inseeCache = new(StringComparer.OrdinalIgnoreCase);

    private static readonly Dictionary<string, string> RegionDeptMapping = new(StringComparer.OrdinalIgnoreCase)
    {
        ["île-de-france"] = "75", ["ile de france"] = "75", ["idf"] = "75",
        ["paca"] = "13", ["provence"] = "13", ["marseille region"] = "13",
        ["bretagne"] = "35",
        ["normandie"] = "76",
        ["occitanie"] = "31", ["toulouse region"] = "31",
        ["nouvelle-aquitaine"] = "33", ["bordeaux region"] = "33",
        ["auvergne-rhone-alpes"] = "69", ["rhone-alpes"] = "69", ["lyon region"] = "69",
        ["grand-est"] = "67", ["alsace"] = "67", ["strasbourg"] = "67",
        ["hauts-de-france"] = "59", ["nord-pas-de-calais"] = "59",
        ["pays-de-la-loire"] = "44", ["nantes region"] = "44",
        ["centre-val-de-loire"] = "45",
        ["bourgogne"] = "21",
        ["corse"] = "2A",
        // Additional direct mappings for main cities to departments if needed, but handled by INSEE mostly
    };

    private static readonly Dictionary<string, string> InseeHardcoded = new(StringComparer.OrdinalIgnoreCase)
    {
        ["paris"]           = "75056",
        ["marseille"]       = "13055",
        ["lyon"]            = "69123",
        ["toulouse"]        = "31555",
        ["nice"]            = "06088",
        ["nantes"]          = "44109",
        ["montpellier"]     = "34172",
        ["strasbourg"]      = "67482",
        ["bordeaux"]        = "33063",
        ["lille"]           = "59350",
        ["rennes"]          = "35238",
        ["reims"]           = "51454",
        ["saint-étienne"]   = "42218",
        ["le havre"]        = "76351",
        ["grenoble"]        = "38185",
        ["dijon"]           = "21231",
        ["angers"]          = "49007",
        ["nîmes"]           = "30189",
        ["villeurbanne"]    = "69266",
        ["clermont-ferrand"]= "63113",
    };

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    // ══════════════════════════════════════════════════════════
    //  OAuth2 — Token (SemaphoreSlim, refresh 60s avant expiry)
    // ══════════════════════════════════════════════════════════

    private async Task<string> GetTokenAsync(CancellationToken ct)
    {
        if (_cachedToken is not null && DateTime.UtcNow < _tokenExpiry.AddSeconds(-60))
            return _cachedToken;

        await _tokenLock.WaitAsync(ct);
        try
        {
            if (_cachedToken is not null && DateTime.UtcNow < _tokenExpiry.AddSeconds(-60))
                return _cachedToken;

            logger.LogInformation("[FT] 🔑 Requesting new OAuth2 token...");

            using var client = httpFactory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, _opts.TokenUrl);
            req.Content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type",    "client_credentials"),
                new KeyValuePair<string, string>("client_id",     _opts.ClientId),
                new KeyValuePair<string, string>("client_secret", _opts.ClientSecret),
                new KeyValuePair<string, string>("scope",         _opts.Scope)
            });

            HttpResponseMessage resp;
            try { resp = await client.SendAsync(req, ct); }
            catch (HttpRequestException ex)
            {
                logger.LogError(ex, "[FT] ❌ OAuth2 server unreachable.");
                throw new InvalidOperationException($"Serveur OAuth2 FranceTravail inaccessible: {ex.Message}", ex);
            }

            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                logger.LogError("[FT] ❌ Token error: {Code} — {Body}", (int)resp.StatusCode, body);
                throw new HttpRequestException($"FT OAuth2 {(int)resp.StatusCode}: {body}");
            }

            var tokenResp = await resp.Content.ReadFromJsonAsync<TokenResponse>(JsonOpts, ct)
                            ?? throw new InvalidOperationException("Token response null.");

            _cachedToken  = tokenResp.AccessToken;
            _tokenExpiry  = DateTime.UtcNow.AddSeconds(tokenResp.ExpiresIn);

            logger.LogInformation("[FT] ✅ Token rafraîchi, expire à {Time:HH:mm:ss}.", _tokenExpiry);
            return _cachedToken;
        }
        finally { _tokenLock.Release(); }
    }

    // ══════════════════════════════════════════════════════════
    //  INSEE Lookup — geo.api.gouv.fr/communes
    // ══════════════════════════════════════════════════════════

    private async Task<string?> GetInseeCodeAsync(string city, CancellationToken ct)
    {
        if (_inseeCache.TryGetValue(city, out var cached)) return cached;

        if (InseeHardcoded.TryGetValue(city, out var hardcoded))
        {
            _inseeCache[city] = hardcoded;
            return hardcoded;
        }

        var url = $"https://geo.api.gouv.fr/communes?nom={Uri.EscapeDataString(city)}&fields=code&limit=1";
        logger.LogDebug("[FT] 📍 INSEE lookup: {City} → {Url}", city, url);

        try
        {
            using var client = httpFactory.CreateClient();
            var resp  = await client.GetAsync(url, ct);
            if (!resp.IsSuccessStatusCode) return null;

            var doc   = await resp.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: ct);
            var root  = doc?.RootElement;
            if (root is null) return null;

            var arr   = root.Value;
            if (arr.GetArrayLength() == 0) return null;

            var code  = arr[0].GetProperty("code").GetString();
            if (!string.IsNullOrEmpty(code))
            {
                _inseeCache[city] = code;
                logger.LogInformation("[FT] ✅ INSEE: {City} → {Code}", city, code);
            }
            return code;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[FT] ❌ INSEE lookup error for {City}", city);
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Search — avec gestion 400 / 401 / 429 / 500
    // ══════════════════════════════════════════════════════════

    public async Task<IReadOnlyList<JobOffer>> SearchJobsAsync(
        string keywords,
        string? location   = null,
        string? contractType = null,
        string range       = "0-14",
        CancellationToken ct = default)
    {
        keywords = SanitizeKeywords(keywords);

        string token;
        try { token = await GetTokenAsync(ct); }
        catch (Exception ex)
        {
            logger.LogError(ex, "[FT] Cannot get token, returning cache.");
            return _lastResults;
        }

        using var client = httpFactory.CreateClient("FranceTravail");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var qs = new System.Text.StringBuilder();
        qs.Append("?motsCles=").Append(Uri.EscapeDataString(keywords));
        qs.Append("&range=").Append(range);

        if (!string.IsNullOrWhiteSpace(location))
        {
            var cityNorm = location.Trim();

            // 1. Check mapped regions
            if (RegionDeptMapping.TryGetValue(cityNorm, out var mappedDept))
            {
                logger.LogInformation("[FT] 📍 Mapping Région: '{City}' → departement={Code}", cityNorm, mappedDept);
                qs.Append("&departement=").Append(mappedDept);
            }
            // 2. Check direct department numbers (e.g. "75", "13", "2A")
            else if (System.Text.RegularExpressions.Regex.IsMatch(cityNorm, @"^(\d{2}|2[AB]|97\d)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                logger.LogInformation("[FT] 📍 Code département direct: '{City}'", cityNorm);
                qs.Append("&departement=").Append(cityNorm.ToUpperInvariant());
            }
            // 3. Try hardcoded INSEE
            else if (InseeHardcoded.TryGetValue(cityNorm, out var hardcodedInsee))
            {
                logger.LogInformation("[FT] 📍 Mapping commune hardcodé: '{City}' → {Code}", cityNorm, hardcodedInsee);
                qs.Append("&commune=").Append(hardcodedInsee);
                qs.Append("&rayon=").Append(_opts.DefaultRadiusKm);
            }
            // 4. Try geo.api.gouv.fr dynamic INSEE lookup
            else
            {
                var insee = await GetInseeCodeAsync(cityNorm, ct);
                if (!string.IsNullOrEmpty(insee))
                {
                    qs.Append("&commune=").Append(insee);
                    qs.Append("&rayon=").Append(_opts.DefaultRadiusKm);
                }
                else
                {
                    logger.LogWarning("[FT] ⚠️ Ville/région/département non trouvé: '{City}' — Recherche sans location", cityNorm);
                }
            }
        }

        if (!string.IsNullOrEmpty(contractType))
        {
            // France Travail V2 contract codes: CDI, CDD, MIS (intérim), SAI (saisonnier/stage), APP (apprentissage/alternance)
            var finalType = contractType switch
            {
                "ALT" => "APP",   // Alternance → Apprentissage (APP) in FT V2
                "MIS" => "MIS",   // Intérim
                "SAI" => "SAI",   // Stage / Saisonnier
                _     => contractType
            };
            qs.Append("&typeContrat=").Append(Uri.EscapeDataString(finalType));
        }

        var url = _opts.SearchUrl + qs;
        logger.LogInformation("[FT] 🔍 GET {Url}", url);

        HttpResponseMessage response;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(2.5));
            response = await client.GetAsync(url, cts.Token);
        }
        catch (Exception ex) when (ex is OperationCanceledException or TaskCanceledException)
        {
            logger.LogWarning("[FT] ⚠️ Timeout — returning cache ({Count} items).", _lastResults.Count);
            return _lastResults;
        }

        if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogWarning("[FT] ⚠️ 400 Bad Request — params: {Url} — body: {Body}", url, body);
            return new List<JobOffer>().AsReadOnly();
        }

        if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            logger.LogWarning("[FT] ⚠️ 429 Rate Limited — returning cache.");
            return _lastResults;
        }

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            logger.LogWarning("[FT] 401 — forcing token refresh then retry.");
            _cachedToken = null; 
            try
            {
                token = await GetTokenAsync(ct);
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                response = await client.GetAsync(url, ct);
            }
            catch
            {
                return _lastResults;
            }
        }

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogError("[FT] ❌ Search {Code} — params: {Url} — body: {Body}", (int)response.StatusCode, url, body);
            return _lastResults; 
        }

        try
        {
            var ftResponse = await response.Content.ReadFromJsonAsync<FtSearchResponse>(JsonOpts, ct);
            if (ftResponse?.Resultats is null) return _lastResults;

            var results = ftResponse.Resultats.Select(MapToJobOffer).ToList().AsReadOnly();
            logger.LogInformation("[FT] ✅ {Count} offres récupérées.", results.Count);

            _lastResults = results;
            return results;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[FT] ❌ Failed to parse FT response — returning cache.");
            return _lastResults;
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Mapping France Travail → APEX JobOffer
    // ══════════════════════════════════════════════════════════

    private static JobOffer MapToJobOffer(FtOffre o) => new(
        Id:                 o.Id ?? Guid.NewGuid().ToString(),
        Title:              o.Intitule ?? "Sans titre",
        Company:            o.Entreprise?.Nom ?? "Entreprise non communiquée",
        CompanyLogoUrl:     o.Entreprise?.Logo,
        Location:           o.LieuTravail?.Libelle ?? "Non précisé",
        PostalCode:         o.LieuTravail?.CodePostal,
        ContractType:       o.TypeContrat ?? "Non précisé",
        ExperienceRequired: o.ExperienceLibelle,
        Description:        o.Description ?? string.Empty,
        RequiredTechs:      ExtractCompetences(o.Competences),
        NiceToHaveTechs:    [],
        RequiredSoftSkills: ExtractQualites(o.QualitesProfessionnelles),
        Trainings:          ExtractFormations(o.Formations),
        SalaryLabel:        o.Salaire?.Libelle,
        SalaryMin:          ParseDecimal(o.Salaire?.Min),
        SalaryMax:          ParseDecimal(o.Salaire?.Max),
        OriginUrl:          o.OrigineOffre?.UrlOrigine,
        DateCreated:        o.DateCreation ?? DateTime.UtcNow
    );

    private static List<string> ExtractCompetences(List<FtCompetence>? c) =>
        c?.Select(x => x.Libelle ?? "").Where(s => s.Length > 0).ToList() ?? [];

    private static List<string> ExtractQualites(List<FtQualite>? q) =>
        q?.Select(x => x.Libelle ?? "").Where(s => s.Length > 0).ToList() ?? [];

    private static List<string> ExtractFormations(List<FtFormation>? f) =>
        f?.Select(x => x.Libelle ?? "").Where(s => s.Length > 0).ToList() ?? [];

    private static decimal? ParseDecimal(string? s) =>
        decimal.TryParse(s, System.Globalization.NumberStyles.Number,
            System.Globalization.CultureInfo.InvariantCulture, out var v) ? v : null;

    private static string SanitizeKeywords(string keywords) =>
        System.Text.RegularExpressions.Regex.Replace(keywords, @"[<>""';\\]", "").Trim();

    // ══════════════════════════════════════════════════════════
    //  DTOs internes France Travail
    // ══════════════════════════════════════════════════════════

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")]   int    ExpiresIn,
        [property: JsonPropertyName("token_type")]   string TokenType
    );

    private sealed class FtSearchResponse
    {
        [JsonPropertyName("resultats")]
        public List<FtOffre>? Resultats { get; set; }
    }

    private sealed class FtOffre
    {
        [JsonPropertyName("id")]                        public string?            Id                      { get; set; }
        [JsonPropertyName("intitule")]                  public string?            Intitule                { get; set; }
        [JsonPropertyName("description")]               public string?            Description             { get; set; }
        [JsonPropertyName("typeContrat")]               public string?            TypeContrat             { get; set; }
        [JsonPropertyName("experienceLibelle")]         public string?            ExperienceLibelle       { get; set; }
        [JsonPropertyName("entreprise")]                public FtEntreprise?      Entreprise              { get; set; }
        [JsonPropertyName("lieuTravail")]               public FtLieu?            LieuTravail             { get; set; }
        [JsonPropertyName("salaire")]                   public FtSalaire?         Salaire                 { get; set; }
        [JsonPropertyName("competences")]               public List<FtCompetence>? Competences            { get; set; }
        [JsonPropertyName("qualitesProfessionnelles")]  public List<FtQualite>?   QualitesProfessionnelles{ get; set; }
        [JsonPropertyName("formations")]                public List<FtFormation>? Formations              { get; set; }
        [JsonPropertyName("origineOffre")]              public FtOrigine?         OrigineOffre            { get; set; }
        [JsonPropertyName("dateCreation")]              public DateTime?          DateCreation            { get; set; }
    }

    private sealed class FtEntreprise
    {
        [JsonPropertyName("nom")]  public string? Nom  { get; set; }
        [JsonPropertyName("logo")] public string? Logo { get; set; }
    }

    private sealed class FtLieu
    {
        [JsonPropertyName("libelle")]    public string? Libelle    { get; set; }
        [JsonPropertyName("codePostal")] public string? CodePostal { get; set; }
    }

    private sealed class FtSalaire
    {
        [JsonPropertyName("libelle")] public string? Libelle { get; set; }
        [JsonPropertyName("min")]     public string? Min     { get; set; }
        [JsonPropertyName("max")]     public string? Max     { get; set; }
    }

    private sealed class FtCompetence
    {
        [JsonPropertyName("libelle")] public string? Libelle { get; set; }
    }

    private sealed class FtQualite
    {
        [JsonPropertyName("libelle")] public string? Libelle { get; set; }
    }

    private sealed class FtFormation
    {
        [JsonPropertyName("libelle")] public string? Libelle { get; set; }
    }

    private sealed class FtOrigine
    {
        [JsonPropertyName("urlOrigine")] public string? UrlOrigine { get; set; }
    }
}
