// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — ProfileController V1 Production               ║
// ║  Bio / Skills / CV Upload avec CvParserAgent                 ║
// ╚══════════════════════════════════════════════════════════════╝

using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using APEX.Agents;
using APEX.Core;
using APEX.Core.Entities;
using APEX.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace APEX.WebAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/profile")]
public class ProfileController(
    ApexDbContext db,
    CvParserAgent cvParser,
    ILogger<ProfileController> logger) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    // ══════════════════════════════════════════════════════════
    //  GET /api/profile
    // ══════════════════════════════════════════════════════════

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var user = await db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        var profile = user.Profile;
        List<string> techs = [];
        List<string> softs = [];

        if (profile?.TechStackJson is not null)
        {
            try { techs = JsonSerializer.Deserialize<List<string>>(profile.TechStackJson) ?? []; } catch { }
        }
        if (profile?.SoftSkillsJson is not null)
        {
            try { softs = JsonSerializer.Deserialize<List<string>>(profile.SoftSkillsJson) ?? []; } catch { }
        }

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            name = user.FullName,
            role = user.Role,
            bio = profile?.Bio ?? profile?.HumanizedBio,
            techs,
            softs,
            hasCv = !string.IsNullOrEmpty(user.CvRawText),
            cvFile = profile?.CvFileName,
            cvDate = profile?.CvUploadedAt
        });
    }

    // ══════════════════════════════════════════════════════════
    //  GET /api/profile/analytics
    // ══════════════════════════════════════════════════════════

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var history = await db.BotAnalytics
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Take(50)
            .Select(b => new
            {
                b.Id,
                b.ActionType,
                b.DetailsJson,
                b.TokensUsed,
                b.CreatedAt
            })
            .ToListAsync();

        var stats = new
        {
            TotalActions = await db.BotAnalytics.CountAsync(b => b.UserId == userId),
            TotalTokens = await db.BotAnalytics.Where(b => b.UserId == userId).SumAsync(b => b.TokensUsed),
            CvAnalyzed = await db.BotAnalytics.CountAsync(b => b.UserId == userId && b.ActionType == "CV_ANALYSIS"),
            JobsScored = await db.BotAnalytics.CountAsync(b => b.UserId == userId && b.ActionType == "JOB_SWIPE_MATCH")
        };

        return Ok(new
        {
            stats,
            history
        });
    }

    // ══════════════════════════════════════════════════════════
    //  PUT /api/profile/bio
    // ══════════════════════════════════════════════════════════

    [HttpPut("bio")]
    public async Task<IActionResult> UpdateBio([FromBody] UpdateBioRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null) return NotFound();

        profile.Bio = req.Bio?.Trim();
        profile.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Bio mise à jour.", bio = profile.Bio });
    }

    // ══════════════════════════════════════════════════════════
    //  PUT /api/profile/techs
    // ══════════════════════════════════════════════════════════

    [HttpPut("techs")]
    public async Task<IActionResult> UpdateTechs([FromBody] UpdateTechsRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        // Sanitize : unique, max 64 chars each, strip XSS
        var safe = req.Techs
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim()[..Math.Min(t.Trim().Length, 64)])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(50)
            .ToList();

        var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null) return NotFound();

        profile.TechStackJson = JsonSerializer.Serialize(safe);
        profile.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Compétences mises à jour.", techs = safe });
    }

    // ══════════════════════════════════════════════════════════
    //  PUT /api/profile/softs
    // ══════════════════════════════════════════════════════════

    [HttpPut("softs")]
    public async Task<IActionResult> UpdateSofts([FromBody] UpdateSoftsRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var safe = req.Softs
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim()[..Math.Min(s.Trim().Length, 64)])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(30)
            .ToList();

        var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null) return NotFound();

        profile.SoftSkillsJson = JsonSerializer.Serialize(safe);
        profile.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Soft skills mises à jour.", softs = safe });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/profile/upload-cv
    // ══════════════════════════════════════════════════════════

    [HttpPost("upload-cv")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit server-side (client : 5MB)
    public async Task<IActionResult> UploadCv(IFormFile? file, [FromForm(Name = "cv")] IFormFile? cv)
    {
        var targetFile = file ?? cv;
        var userId = GetUserId();
        if (userId is null) 
            return Unauthorized(new { error = "Veuillez vous connecter pour importer votre CV." });

        if (targetFile is null || targetFile.Length == 0)
            return BadRequest(new { error = "Aucun fichier envoyé." });

        if (targetFile.Length > 5 * 1024 * 1024)
            return BadRequest(new { error = "Fichier trop volumineux. Maximum 5 MB." });

        if (!targetFile.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase)
            && !targetFile.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Seuls les fichiers PDF sont acceptés pour l'analyse automatique." });

        // Validate PDF magic bytes (%PDF — 0x25 0x50 0x44 0x46)
        using (var magicStream = targetFile.OpenReadStream())
        {
            var magic = new byte[4];
            var read = await magicStream.ReadAsync(magic.AsMemory(0, 4));
            if (read < 4 || magic[0] != 0x25 || magic[1] != 0x50 || magic[2] != 0x44 || magic[3] != 0x46)
                return BadRequest(new { error = "Le fichier n'est pas un PDF valide." });
        }

        var user = await db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound(new { error = "Utilisateur introuvable." });

        try
        {
            logger.LogInformation("[PROFILE] CV upload: userId={Id} file={File}", userId, targetFile.FileName);

            using var stream = targetFile.OpenReadStream();
            var result = await cvParser.ParsePdfAsync(stream);

            // Mise à jour de l'entité User (raw text)
            user.CvRawText = result.RawText;
            user.UpdatedAt = DateTime.UtcNow;

            // Mise à jour du profil
            var profile = user.Profile ?? new Core.Entities.UserProfile { UserId = userId.Value };
            if (user.Profile is null) db.UserProfiles.Add(profile);

            profile.HumanizedBio = result.HumanizedBio;
            profile.ProfileJson = JsonSerializer.Serialize(result.Profile, JsonOpts);
            profile.CvFileName = targetFile.FileName;
            profile.CvUploadedAt = DateTime.UtcNow;
            profile.UpdatedAt = DateTime.UtcNow;

            // Extraire les techs du profil parsé
            if (result.Profile?.Technologies is not null)
            {
                var techList = result.Profile.Technologies.Keys.ToList();
                profile.TechStackJson = JsonSerializer.Serialize(techList);
            }

            db.BotAnalytics.Add(new BotAnalytic
            {
                UserId = userId.Value,
                ActionType = "CV_PARSED",
                TokensUsed = 0,
                DetailsJson = JsonSerializer.Serialize(new { fileName = targetFile.FileName, techsFound = result.Profile?.Technologies?.Count ?? 0 }, JsonOpts),
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();

            logger.LogInformation("[PROFILE] CV analysé: userId={Id}", userId);
            return Ok(new
            {
                message = "CV analysé avec succès.",
                bio = result.HumanizedBio,
                techs = result.Profile?.Technologies?.Keys.ToList(),
                isImageBased = string.IsNullOrWhiteSpace(result.RawText)
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[PROFILE] CV upload error: userId={Id}", userId);
            return StatusCode(500, new { error = "L'analyse IA a échoué. Vérifiez que le PDF est lisible et réessayez." });
        }
    }

    // ── Helpers ────────────────────────────────────────────────

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }
}

// ── DTOs ───────────────────────────────────────────────────────

public record UpdateBioRequest([MaxLength(1000)] string? Bio);
public record UpdateTechsRequest([Required] List<string> Techs);
public record UpdateSoftsRequest([Required] List<string> Softs);
