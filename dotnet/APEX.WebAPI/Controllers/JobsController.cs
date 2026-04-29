// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — JobsController V1 Production                  ║
// ║  Search (guest OK) + Analyze + Chat + Batch                  ║
// ╚══════════════════════════════════════════════════════════════╝

using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using APEX.Agents;
using APEX.Core;
using APEX.Core.Entities;
using APEX.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

using APEX.Infrastructure.ExternalApis;

namespace APEX.WebAPI.Controllers;

[ApiController]
[Route("api/jobs")]
public class JobsController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private static readonly Regex InjectionPattern = new(
        @"jailbreak|DAN|base64|<script|javascript:|ignore\s+(?:previous|above|all)|pretend|bypass|system\s*prompt|override|eval\s*\(|onerror|onload|onclick|prompt\s*\(|alert\s*\(|document\.|window\.|\bfetch\s*\(|\bimport\s*\(",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly IJobService _jobService;
    private readonly IAgentAnalyst _analyst;
    private readonly ApexDbContext _db;
    private readonly AiSettings _aiSettings;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ArbeitnowClient _arbeitnow;
    private readonly AdzunaClient _adzuna;
    private readonly MuseClient _muse;
    private readonly ILogger<JobsController> _logger;

    public JobsController(
        IJobService jobService,
        IAgentAnalyst analyst,
        ApexDbContext db,
        IOptions<AiSettings> aiOpts,
        IHttpClientFactory httpFactory,
        ArbeitnowClient arbeitnow,
        AdzunaClient adzuna,
        MuseClient muse,
        ILogger<JobsController> logger)
    {
        _jobService = jobService;
        _analyst = analyst;
        _db = db;
        _aiSettings = aiOpts.Value;
        _httpFactory = httpFactory;
        _arbeitnow = arbeitnow;
        _adzuna = adzuna;
        _muse = muse;
        _logger = logger;
    }

    // ══════════════════════════════════════════════════════════
    //  GET /api/jobs/search
    // ══════════════════════════════════════════════════════════

    [HttpGet("search")]
    [EnableRateLimiting("search")]
    public async Task<IActionResult> Search(
        [FromQuery, MaxLength(128)] string keywords = "",
        [FromQuery, MaxLength(128)] string keyword = "",
        [FromQuery, MaxLength(128)] string? location = null,
        [FromQuery, MaxLength(16)] string? contract = null,
        [FromQuery] string country = "fr",
        [FromQuery] string range = "0-14",
        CancellationToken ct = default)
    {
        // Accept both "keyword" (JS shorthand) and "keywords" (controller canonical)
        // "keyword" always wins when provided
        if (!string.IsNullOrWhiteSpace(keyword)) keywords = keyword;
        if (string.IsNullOrWhiteSpace(keywords) && string.IsNullOrWhiteSpace(location) && string.IsNullOrWhiteSpace(contract))
            keywords = "développeur";
        var userId = TryGetUserId();
        var sw = System.Diagnostics.Stopwatch.StartNew();

        keywords = Regex.Replace(keywords, @"[<>""';\\]", "").Trim();
        if (keywords.Length > 128) keywords = keywords[..128];

        _logger.LogInformation(
            "[JOBS] Search: keywords={K} location={L} contract={C} country={Cnt} user={U}",
            keywords, location, contract, country, userId);

        try
        {
            bool isFrance = string.IsNullOrWhiteSpace(country) || country.Equals("fr", StringComparison.OrdinalIgnoreCase);

            // 1. France Travail (Aggressive range 0-149 for infinite scroll support)
            var ftTask = isFrance
                ? _jobService.SearchJobsAsync(keywords, location, contract, range, ct)
                : Task.FromResult<IReadOnlyList<JobOffer>>([]);

            // 2. Adzuna (Fallback/Supplement)
            var adzTask = _adzuna.SearchAsync(keywords, location, country, ct);

            // 3. Arbeitnow (Fallback/Remote)
            var arbTask = _arbeitnow.SearchAsync(keywords, location, ct);

            // Parallel wait with safety
            try { await ftTask; } catch (Exception ex) { _logger.LogError(ex, "[JOBS] FT failed"); }
            try { await adzTask; } catch (Exception ex) { _logger.LogError(ex, "[JOBS] Adzuna failed"); }
            try { await arbTask; } catch (Exception ex) { _logger.LogError(ex, "[JOBS] Arbeitnow failed"); }

            var jobs = ftTask.IsCompletedSuccessfully ? ftTask.Result : new List<JobOffer>();
            var adzJobs = adzTask.IsCompletedSuccessfully ? adzTask.Result : new List<JobOffer>();
            var arbJobs = arbTask.IsCompletedSuccessfully ? arbTask.Result : new List<JobOffer>();

            // Adzuna/Arbeitnow filtering for France
            if (isFrance)
            {
                adzJobs = adzJobs.Where(j => 
                    j.Location?.Contains("France", StringComparison.OrdinalIgnoreCase) == true ||
                    j.Location?.Contains("Remote", StringComparison.OrdinalIgnoreCase) == true ||
                    (location != null && j.Location?.Contains(location, StringComparison.OrdinalIgnoreCase) == true)
                ).ToList();

                arbJobs = arbJobs.Where(j => 
                    j.Location?.Contains("France", StringComparison.OrdinalIgnoreCase) == true ||
                    j.Location?.Contains("Remote", StringComparison.OrdinalIgnoreCase) == true ||
                    (location != null && j.Location?.Contains(location, StringComparison.OrdinalIgnoreCase) == true)
                ).ToList();
            }

            var existingKeys = jobs.Select(j => $"{j.Title?.ToLowerInvariant()}_{j.Company?.ToLowerInvariant()}").ToHashSet();
            var newAdz = adzJobs.Where(j => !existingKeys.Contains($"{j.Title?.ToLowerInvariant()}_{j.Company?.ToLowerInvariant()}"));
            var newArb = arbJobs.Where(j => !existingKeys.Contains($"{j.Title?.ToLowerInvariant()}_{j.Company?.ToLowerInvariant()}"));
            
            var allResults = jobs.Concat(newAdz).Concat(newArb).ToList();

            sw.Stop();
            _logger.LogInformation("[JOBS] Final Search {K} in {L}: FT:{FT}, Adzuna:{ADZ}, Arbeitnow:{AN}. Total:{T} in {Ms}ms",
                keywords, location, jobs.Count, adzJobs.Count, arbJobs.Count, allResults.Count, sw.ElapsedMilliseconds);

            _ = PersistJobsAsync(allResults);
            return Ok(new { count = allResults.Count, results = allResults });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[JOBS] Search error");
            return StatusCode(502, new { error = "Erreur de connexion à France Travail." });
        }
    }

    // ══════════════════════════════════════════════════════
    //  GET /api/jobs/company?name=...
    //  Returns Muse company profile (no auth required, cached)
    // ══════════════════════════════════════════════════════

    [HttpGet("company")]
    [EnableRateLimiting("search")]
    public async Task<IActionResult> GetCompanyProfile(
        [FromQuery, Required, MaxLength(128)] string name,
        CancellationToken ct = default)
    {
        var company = await _muse.GetCompanyAsync(name, ct);
        if (company is null) return NotFound(new { found = false });
        return Ok(new
        {
            found = true,
            name = company.Name,
            description = company.Description,
            size = company.Size,
            url = company.Url,
            logoUrl = company.LogoUrl
        });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/jobs/analyze
    // ══════════════════════════════════════════════════════════

    [HttpPost("analyze")]
    [Authorize]
    [EnableRateLimiting("analyze")]
    public async Task<IActionResult> Analyze(
        [FromBody] AnalyzeRequest req,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserIdOrFail();
        if (userId is null) return Unauthorized();

        var profile = await LoadUserProfileAsync(userId.Value);
        if (profile is null)
            return BadRequest(new { error = "Uploadez votre CV pour accéder à l'analyse IA." });

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = await _analyst.AnalyzeAsync(req.Job, profile, ct);
        sw.Stop();

        _logger.LogInformation(
            "[JOBS] Analyze: jobId={Id} user={U} score={S} tier={T} in {Ms}ms",
            req.Job.Id, userId, result.OverallScore, result.MatchTier, sw.ElapsedMilliseconds);

        return Ok(result);
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/jobs/analyze-batch
    // ══════════════════════════════════════════════════════════

    [HttpPost("analyze-batch")]
    [Authorize]
    [EnableRateLimiting("analyzeBatch")]
    public async Task<IActionResult> AnalyzeBatch(
        [FromBody] AnalyzeBatchRequest req,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (req.Jobs.Count > 20)
            return BadRequest(new { error = "Maximum 20 offres par batch." });

        var userId = GetUserIdOrFail();
        if (userId is null) return Unauthorized();

        var profile = await LoadUserProfileAsync(userId.Value);
        if (profile is null)
            return BadRequest(new { error = "Uploadez votre CV pour accéder à l'analyse IA." });

        var results = new List<MatchResult>();
        foreach (var job in req.Jobs)
        {
            var r = await _analyst.AnalyzeAsync(job, profile, ct);
            results.Add(r);
        }

        return Ok(new
        {
            count = results.Count,
            goCount = results.Count(r => r.Verdict == Verdict.Go),
            noGoCount = results.Count(r => r.Verdict == Verdict.NoGo),
            results
        });
    }



    // ══════════════════════════════════════════════════════════
    //  GET /api/jobs/filters
    // ══════════════════════════════════════════════════════════

    [HttpGet("filters")]
    public IActionResult GetFilters()
    {
        return Ok(new
        {
            contractTypes = new[]
            {
                new { code = "CDI", label = "CDI" },
                new { code = "CDD", label = "CDD" },
                new { code = "MIS", label = "Intérim" },
                new { code = "ALT", label = "Alternance" },
                new { code = "SAI", label = "Saisonnier" },
            },
            experienceLevels = new[]
            {
                new { code = "D", label = "Débutant accepté" },
                new { code = "S", label = "Expérience souhaitée" },
                new { code = "E", label = "Expérience exigée" },
            }
        });
    }

    // ══════════════════════════════════════════════════════════
    //  ADMIN — Pool stats
    // ══════════════════════════════════════════════════════════

    [Authorize(Roles = "admin")]
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct = default)
    {
        var totalOffers = await _db.JobOffers.CountAsync(ct);
        var totalUsers = await _db.Users.CountAsync(ct);
        return Ok(new
        {
            totalOffers,
            totalUsers,
            lastFetch = await _db.JobOffers.OrderByDescending(j => j.FetchedAt)
                            .Select(j => j.FetchedAt).FirstOrDefaultAsync(ct)
        });
    }



    // ══════════════════════════════════════════════════════════
    //  GET /api/jobs/export  — CSV download (guest OK)
    // ══════════════════════════════════════════════════════════

    [HttpGet("export")]
    [EnableRateLimiting("search")]
    public async Task<IActionResult> Export(
        [FromQuery, MaxLength(128)] string keywords = "développeur",
        [FromQuery, MaxLength(128)] string? location = null,
        [FromQuery, MaxLength(16)] string? contract = null,
        CancellationToken ct = default)
    {
        keywords = System.Text.RegularExpressions.Regex.Replace(keywords, @"[<>""';\\]", "").Trim();
        if (keywords.Length > 128) keywords = keywords[..128];

        IReadOnlyList<JobOffer> jobs;
        try { jobs = await _jobService.SearchJobsAsync(keywords, location, contract, "0-29", ct); }
        catch { return StatusCode(502, new { error = "Erreur lors de la recherche." }); }

        static string Csv(string? s) =>
            s is null ? "" : $"\"{s.Replace("\"", "\"\"").Replace("\n", " ").Replace("\r", "")}\"";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Titre,Entreprise,Ville,Contrat,Salaire,Date,Lien");
        foreach (var j in jobs)
            sb.AppendLine($"{Csv(j.Title)},{Csv(j.Company)},{Csv(j.Location)},{Csv(j.ContractType)},{Csv(j.SalaryLabel)},{Csv(j.DateCreated.ToString("yyyy-MM-dd"))},{Csv(j.OriginUrl)}");

        var utf8Bom = System.Text.Encoding.UTF8.GetPreamble()
            .Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString())).ToArray();

        return File(utf8Bom, "text/csv; charset=utf-8",
            $"apex-offres-{keywords.Replace(" ", "_")}-{DateTime.UtcNow:yyyyMMdd}.csv");
    }



    // ══════════════════════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════════════════════

    private static string SanitizeChatInput(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        input = input.Length > 500 ? input[..500] : input;
        input = InjectionPattern.Replace(input, "[filtré]");
        return input.Trim();
    }

    private async Task<CandidateProfile?> LoadUserProfileAsync(int userId)
    {
        var dbProfile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (dbProfile?.ProfileJson is null) return null;
        try
        {
            return JsonSerializer.Deserialize<CandidateProfile>(dbProfile.ProfileJson, JsonOpts);
        }
        catch { return null; }
    }

    private static string CleanText(string? text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        // Fix common UTF-8 double-encoding artifacts
        return text
            .Replace("Ã©", "é").Replace("Ã¨", "è").Replace("Ã ", "à")
            .Replace("Ã¢", "â").Replace("Ã®", "î").Replace("Ã´", "ô")
            .Replace("Ã¹", "ù").Replace("Ã»", "û").Replace("Ã§", "ç")
            .Replace("Ã‰", "É").Replace("Ãª", "ê")
            .Replace("Ã¢â€šÂ¬", "€").Replace("â‚¬", "€")
            .Replace("Â°", "°")
            .Trim();
    }

    private async Task PersistJobsAsync(IReadOnlyList<JobOffer> jobs)
    {
        try
        {
            if (jobs == null || jobs.Count == 0) return;

            using var scope = HttpContext.RequestServices.CreateScope();
            var scopedDb = scope.ServiceProvider.GetRequiredService<ApexDbContext>();

            // 1. Déduplication locale (dans la liste entrante)
            var uniqueJobs = jobs.GroupBy(j => j.Id).Select(g => g.First()).ToList();
            var ids = uniqueJobs.Select(j => j.Id).ToList();

            // 2. Récupérer les IDs déjà en base pour filtrer
            var existingIds = await scopedDb.JobOffers
                .Where(j => ids.Contains(j.Id))
                .Select(j => j.Id)
                .ToListAsync();

            var toAdd = uniqueJobs.Where(j => !existingIds.Contains(j.Id)).ToList();

            foreach (var job in toAdd)
            {
                // Vérifier si déjà tracké par ChangeTracker pour éviter conflits batch
                if (scopedDb.ChangeTracker.Entries<JobOfferEntity>().Any(e => e.Entity.Id == job.Id))
                    continue;

                scopedDb.JobOffers.Add(new JobOfferEntity
                {
                    Id = job.Id,
                    Title = CleanText(job.Title) ?? "Sans titre",
                    Description = CleanText(job.Description) ?? "",
                    CompanyName = CleanText(job.Company),
                    CompanyLogoUrl = job.CompanyLogoUrl,
                    City = CleanText(job.Location),
                    PostalCode = job.PostalCode,
                    ContractType = job.ContractType,
                    ExperienceRequired = job.ExperienceRequired,
                    SalaryLabel = CleanText(job.SalaryLabel),
                    SalaryMin = job.SalaryMin,
                    SalaryMax = job.SalaryMax,
                    TechSkillsJson = JsonSerializer.Serialize(job.RequiredTechs ?? new List<string>()),
                    SoftSkillsJson = JsonSerializer.Serialize(job.RequiredSoftSkills ?? new List<string>()),
                    TrainingsJson = JsonSerializer.Serialize(job.Trainings ?? new List<string>()),
                    ApplyUrl = job.OriginUrl,
                    FetchedAt = DateTime.UtcNow
                });
            }

            if (toAdd.Count > 0)
                await scopedDb.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[JOBS] PersistJobsAsync failed for {Count} jobs", jobs.Count);
        }
    }

    private int? TryGetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }

    private int? GetUserIdOrFail() => TryGetUserId();
}

// ── Request DTOs ────────────────────────────────────────────────

public record AnalyzeRequest([Required] JobOffer Job);
public record AnalyzeBatchRequest([Required] List<JobOffer> Jobs);
public record ChatRequest([Required, MaxLength(500)] string Message, List<ChatTurn>? History = null);
// MaxLength on Text guards against DoS via oversized history deserialization
public record ChatTurn(string Role, [MaxLength(500)] string Text);
public record SuggestRequest([MaxLength(120)] string? Text);
public record SkillsGapRequest([MaxLength(128)] string? Keywords);
