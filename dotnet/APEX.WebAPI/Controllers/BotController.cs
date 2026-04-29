// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — BotController                                 ║
// ║  Chat, Suggest, Skills-Gap AI operations                     ║
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

namespace APEX.WebAPI.Controllers;

[ApiController]
[Route("api/bot")]
public class BotController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private static readonly Regex InjectionPattern = new(
        @"jailbreak|DAN|base64|<script|javascript:|ignore\s+(?:previous|above|all)|pretend|bypass|system\s*prompt|override|eval\s*\(|onerror|onload|onclick|prompt\s*\(|alert\s*\(|document\.|window\.|\bfetch\s*\(|\bimport\s*\(",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly ApexDbContext _db;
    private readonly AiSettings _aiSettings;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<BotController> _logger;

    public BotController(
        ApexDbContext db,
        IOptions<AiSettings> aiOpts,
        IHttpClientFactory httpFactory,
        ILogger<BotController> logger)
    {
        _db = db;
        _aiSettings = aiOpts.Value;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/bot/chat
    // ══════════════════════════════════════════════════════════

    [HttpPost("chat")]
    [EnableRateLimiting("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest req, CancellationToken ct = default)
    {
        var apiKey = _aiSettings.ApiKey;
        var model = _aiSettings.FlashModel ?? "gemini-2.0-flash";
        if (string.IsNullOrEmpty(apiKey) || apiKey.StartsWith("REPLACE_ME"))
        {
            _logger.LogError("[CHAT] AI API key not configured!");
            return Ok(new { reply = "Clé API IA non configurée. Ajoutez votre clé dans appsettings.Development.json.", fallback = true });
        }

        var userMsg = SanitizeChatInput((req.Message ?? "").Trim());
        if (userMsg.Length == 0)
            return BadRequest(new { error = "Message vide ou invalide." });

        if (req.History is { Count: > 100 })
            return BadRequest(new { error = "Historique trop long." });

        var isAuthenticated = TryGetUserId().HasValue;
        var systemPrompt = isAuthenticated
            ? "Tu es APEX Agent, assistant carrière expert emploi en France (numérique, commerce, santé, BTP, industrie, restauration, RH, finance). Réponds en français, directement, en 3-4 phrases. Sois pratique et concret."
            : "Tu es APEX, un assistant carrière emploi français. Réponds en français, directement et en 3-4 phrases max. Sois concret et utile.";

        try
        {
            (string? text, System.Net.HttpStatusCode status) = _aiSettings.Provider.Equals("openrouter", StringComparison.OrdinalIgnoreCase)
                ? await CallOpenRouterAsync(model, apiKey, systemPrompt, req, userMsg, ct)
                : await CallGeminiAsync(model, apiKey, systemPrompt, req, userMsg, ct);

            if (text == null && (status == System.Net.HttpStatusCode.TooManyRequests
                || status == System.Net.HttpStatusCode.ServiceUnavailable
                || status == System.Net.HttpStatusCode.NotFound))
            {
                var fallbackModel = _aiSettings.ProModel ?? model;
                _logger.LogWarning("[CHAT] Modèle principal indisponible ({Status}) — fallback {M}", (int)status, fallbackModel);
                (text, status) = _aiSettings.Provider.Equals("openrouter", StringComparison.OrdinalIgnoreCase)
                    ? await CallOpenRouterAsync(fallbackModel, apiKey, systemPrompt, req, userMsg, ct)
                    : await CallGeminiAsync(fallbackModel, apiKey, systemPrompt, req, userMsg, ct);
            }

            if (text == null)
            {
                var errMsg = status == System.Net.HttpStatusCode.TooManyRequests
                    ? "Quota IA atteint. Réessayez dans quelques minutes ou configurez une clé OpenRouter sur openrouter.ai."
                    : "Service IA temporairement indisponible. Réessayez dans quelques instants.";
                return Ok(new { reply = errMsg, fallback = true });
            }

            return Ok(new { reply = text, fallback = false });
        }
        catch (Exception ex)
        {
            _logger.LogError("[CHAT] Exception non gérée — {Msg}", ex.Message);
            return Ok(new { reply = "Erreur technique. Réessayez.", fallback = true });
        }
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/bot/suggest  — AI autocomplete (guest OK)
    // ══════════════════════════════════════════════════════════

    [HttpPost("suggest")]
    [EnableRateLimiting("chat")]
    public async Task<IActionResult> Suggest(
        [FromBody] SuggestRequest req,
        CancellationToken ct = default)
    {
        var apiKey = _aiSettings.ApiKey;
        var model = _aiSettings.FlashModel;
        if (string.IsNullOrEmpty(apiKey) || apiKey.StartsWith("DEV_ONLY"))
            return Ok(new { suggestions = Array.Empty<string>() });

        var text = (req.Text ?? "").Trim();
        if (text.Length < 2 || InjectionPattern.IsMatch(text))
            return Ok(new { suggestions = Array.Empty<string>() });

        var prompt = $"Liste 5 suggestions de recherche d'emploi pour l'entrée partielle \"{text}\". Retourne UNIQUEMENT un tableau JSON de strings. Seulement le JSON, rien d'autre.";
        try
        {
            var fakeReq = new ChatRequest(prompt, null);
            (string? responseText, System.Net.HttpStatusCode _) = await CallGeminiAsync(model, apiKey, systemPrompt: "", fakeReq, prompt, ct);
            if (responseText is null) return Ok(new { suggestions = Array.Empty<string>() });
            var arrayMatch = System.Text.RegularExpressions.Regex.Match(responseText, @"\[.*?\]", System.Text.RegularExpressions.RegexOptions.Singleline);
            if (!arrayMatch.Success) return Ok(new { suggestions = Array.Empty<string>() });
            var suggestions = JsonSerializer.Deserialize<string[]>(arrayMatch.Value, JsonOpts);
            return Ok(new { suggestions = (suggestions ?? []).Take(5).Select(s => s.Trim()).ToArray() });
        }
        catch
        {
            return Ok(new { suggestions = Array.Empty<string>() });
        }
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/bot/skills-gap  — analyse écart compétences
    // ══════════════════════════════════════════════════════════

    [HttpPost("skills-gap")]
    [Authorize]
    [EnableRateLimiting("analyze")]
    public async Task<IActionResult> SkillsGap(
        [FromBody] SkillsGapRequest req,
        CancellationToken ct = default)
    {
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized();

        var profile = await LoadUserProfileAsync(userId.Value);
        if (profile is null)
            return BadRequest(new { error = "Uploadez votre CV pour accéder à l'analyse d'écart." });

        var apiKey = _aiSettings.ApiKey;
        if (string.IsNullOrEmpty(apiKey) || apiKey.StartsWith("DEV_ONLY"))
            return Ok(new { analysis = "Clé API Gemini non configurée.", fallback = true });

        var userTechs = string.Join(", ", profile.Technologies.Keys.Take(20));
        var userSofts = string.Join(", ", profile.SoftSkills?.Take(10) ?? Array.Empty<string>());

        var kw = (req.Keywords ?? "").Trim();
        kw = System.Text.RegularExpressions.Regex.Replace(kw, @"[<>""';\\]", "");
        if (kw.Length > 128) kw = kw[..128];

        var recentJobs = await _db.JobOffers
            .Where(j => j.IsActive && (kw == "" || j.Title.Contains(kw)))
            .OrderByDescending(j => j.FetchedAt)
            .Take(25)
            .Select(j => new { j.Title, j.TechSkillsJson, j.SoftSkillsJson })
            .ToListAsync(ct);

        var allTechs = recentJobs
            .SelectMany(j =>
            {
                try { return JsonSerializer.Deserialize<List<string>>(j.TechSkillsJson, JsonOpts) ?? []; }
                catch { return Enumerable.Empty<string>(); }
            })
            .GroupBy(t => t.ToLowerInvariant())
            .OrderByDescending(g => g.Count())
            .Take(20)
            .Select(g => $"{g.Key} ({g.Count()}x)")
            .ToList();

        var prompt = $$"""
Tu es un conseiller carrière expert. Analyse l'écart de compétences entre ce profil et le marché.

PROFIL:
- Compétences techniques: {{(userTechs.Length > 0 ? userTechs : "non renseigné")}}
- Soft skills: {{(userSofts.Length > 0 ? userSofts : "non renseigné")}}

COMPÉTENCES DEMANDÉES par le marché ({{recentJobs.Count}} offres récentes{{(kw != "" ? $" pour '{kw}'" : "")}}):
{{(allTechs.Count > 0 ? string.Join(", ", allTechs) : "données insuffisantes")}}

Réponds UNIQUEMENT en JSON strict:
{"topMissing":["compétence1","compétence2","compétence3"],"topMatched":["compétence1","compétence2"],"marketScore":65,"summary":"conseil personnalisé bienveillant en 2-3 phrases"}
""";

        var payload = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { maxOutputTokens = 512, temperature = 0.4 }
        };

        try
        {
            var fakeReq2 = new ChatRequest(prompt, null);
            (string? responseText, System.Net.HttpStatusCode _) = await CallGeminiAsync(_aiSettings.FlashModel, apiKey, systemPrompt: "", fakeReq2, prompt, ct);
            if (responseText is null)
                return Ok(new { analysis = "Analyse indisponible.", fallback = true });

            var m = System.Text.RegularExpressions.Regex.Match(responseText, @"\{.*\}", System.Text.RegularExpressions.RegexOptions.Singleline);
            if (!m.Success) return Ok(new { analysis = responseText, fallback = false });

            var gapResult = JsonDocument.Parse(m.Value);
            return Ok(new { gap = gapResult.RootElement, fallback = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BOT] SkillsGap error");
            return Ok(new { analysis = "Erreur lors de l'analyse.", fallback = true });
        }
    }

    // ── OpenRouter (compatible OpenAI format) ─────────────────
    private async Task<(string? Text, System.Net.HttpStatusCode Status)> CallOpenRouterAsync(
        string model, string apiKey, string systemPrompt,
        ChatRequest req, string userMsg, CancellationToken ct)
    {
        var baseUrl = string.IsNullOrEmpty(_aiSettings.BaseUrl)
            ? "https://openrouter.ai/api/v1"
            : _aiSettings.BaseUrl;

        var messages = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };

        if (req.History is { Count: > 0 })
        {
            foreach (var turn in req.History.TakeLast(10))
            {
                var role = turn.Role?.ToLowerInvariant() == "model" ? "assistant" : "user";
                var t = SanitizeChatInput((turn.Text ?? "").Trim());
                if (t.Length > 0) messages.Add(new { role, content = t });
            }
        }
        messages.Add(new { role = "user", content = userMsg });

        var payload = JsonSerializer.Serialize(new
        {
            model,
            messages,
            max_tokens = _aiSettings.MaxOutputTokens > 0 ? _aiSettings.MaxOutputTokens : 1024
        }, JsonOpts);

        var client = _httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(_aiSettings.TimeoutSeconds > 0 ? _aiSettings.TimeoutSeconds : 30);
        client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {apiKey}");
        client.DefaultRequestHeaders.TryAddWithoutValidation("HTTP-Referer", _aiSettings.SiteUrl ?? "https://apex-avers.fr");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Title", _aiSettings.SiteName ?? "APEX by AVERS");

        _logger.LogInformation("[CHAT] OpenRouter POST {Url} model={Model}", baseUrl, model);

        HttpResponseMessage response;
        string raw;
        try
        {
            response = await client.PostAsync($"{baseUrl}/chat/completions",
                new StringContent(payload, System.Text.Encoding.UTF8, "application/json"), ct);
            raw = await response.Content.ReadAsStringAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError("[CHAT] OpenRouter réseau/timeout — {Msg}", ex.Message);
            return (null, System.Net.HttpStatusCode.ServiceUnavailable);
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("[CHAT] OpenRouter {Status} — {Body}", (int)response.StatusCode, raw.Length > 300 ? raw[..300] : raw);
            return (null, response.StatusCode);
        }

        try
        {
            var doc = JsonDocument.Parse(raw);
            var text = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            return (text ?? "Pas de réponse.", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError("[CHAT] OpenRouter JSON parse error — {Msg}", ex.Message);
            return (null, response.StatusCode);
        }
    }

    // ── Gemini (original) ─────────────────────────────────────
    private async Task<(string? Text, System.Net.HttpStatusCode Status)> CallGeminiAsync(
        string model, string apiKey, string systemPrompt,
        ChatRequest req, string userMsg, CancellationToken ct)
    {
        var contentsList = new List<object>();

        if (req.History is { Count: > 0 })
        {
            foreach (var turn in req.History.TakeLast(10))
            {
                var role = turn.Role?.ToLowerInvariant() == "model" ? "model" : "user";
                var t = SanitizeChatInput((turn.Text ?? "").Trim());
                if (t.Length > 0) contentsList.Add(new { role, parts = new[] { new { text = t } } });
            }
        }
        contentsList.Add(new { role = "user", parts = new[] { new { text = userMsg } } });

        var payload = new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = contentsList,
            generationConfig = new
            {
                maxOutputTokens = _aiSettings.MaxOutputTokens > 0 ? _aiSettings.MaxOutputTokens : 1024,
                temperature = 0.7
            }
        };

        var json = JsonSerializer.Serialize(payload, JsonOpts);
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
        var client = _httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(_aiSettings.TimeoutSeconds > 0 ? _aiSettings.TimeoutSeconds : 30);

        _logger.LogInformation("[CHAT] Gemini POST model={Model}", model);

        HttpResponseMessage response;
        string raw;
        try
        {
            response = await client.PostAsync(url,
                new StringContent(json, System.Text.Encoding.UTF8, "application/json"), ct);
            raw = await response.Content.ReadAsStringAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError("[CHAT] Gemini réseau/timeout — {Msg}", ex.Message);
            return (null, System.Net.HttpStatusCode.ServiceUnavailable);
        }

        if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            _logger.LogWarning("[CHAT] Gemini TooManyRequests [{Model}]", model);
            return (null, System.Net.HttpStatusCode.TooManyRequests);
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("[CHAT] Gemini {Status} [{Model}] — {Body}", (int)response.StatusCode, model, raw.Length > 300 ? raw[..300] : raw);
            return (null, response.StatusCode);
        }

        try
        {
            var doc = JsonDocument.Parse(raw);
            var candidates = doc.RootElement.GetProperty("candidates");
            if (candidates.GetArrayLength() == 0) return (null, response.StatusCode);
            var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
            return (text ?? "Pas de réponse.", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError("[CHAT] Gemini JSON parse — {Msg}", ex.Message);
            return (null, response.StatusCode);
        }
    }

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

    private int? TryGetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }
}
