// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — AuthController V1 Production                  ║
// ║  JWT + Refresh Token HttpOnly + Email Confirmation           ║
// ║  Anti-brute force via rate limiting (Program.cs)             ║
// ╚══════════════════════════════════════════════════════════════╝

using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using APEX.Core;
using APEX.Core.Entities;
using APEX.Infrastructure.Data;
using APEX.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace APEX.WebAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ApexDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IEmailService _email;
    private readonly IBackgroundTaskQueue _queue;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ApexDbContext db,
        ITokenService tokens,
        IEmailService email,
        IBackgroundTaskQueue queue,
        IWebHostEnvironment env,
        ILogger<AuthController> logger)
    {
        _db = db;
        _tokens = tokens;
        _email = email;
        _queue = queue;
        _env = env;
        _logger = logger;
    }

    // ── Cookie Config ───────────────────────────────────────────
    private CookieOptions RefreshCookieOptions() => new()
    {
        HttpOnly = true,
        Secure = _env.IsProduction(), // false en dev (HTTP localhost)
        SameSite = SameSiteMode.Strict,
        Expires = DateTime.UtcNow.AddDays(7),
        Path = "/api/auth"         // scope limité
    };

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/register
    // ══════════════════════════════════════════════════════════

    [HttpPost("register")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new
            {
                errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
            });

        // Vérification format password (min 8, 1 majuscule, 1 chiffre)
        if (!Regex.IsMatch(req.Password, @"^(?=.*[A-Z])(?=.*\d).{8,}$"))
            return BadRequest(new
            {
                errors = new[] {
                "Le mot de passe doit faire au moins 8 caractères avec 1 majuscule et 1 chiffre." }
            });

        // Vérification unicité email (IsDeleted=false)
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower() && !u.IsDeleted))
            return BadRequest(new { errors = new[] { "Cet email est déjà utilisé." } });

        var isDev = _env.IsDevelopment();
        var confirmToken = GenerateSecureToken();
        var user = new AppUser
        {
            Email = req.Email.ToLower().Trim(),
            FullName = req.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            Role = "user",
            IsEmailConfirmed = isDev, // Auto-confirm en dev
            EmailConfirmToken = confirmToken,
            EmailConfirmTokenExpiry = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);

        // Profil vide
        _db.UserProfiles.Add(new Core.Entities.UserProfile { User = user });

        await _db.SaveChangesAsync();
        _logger.LogInformation("[AUTH] Inscription: {Email}", user.Email);

        if (isDev)
        {
            _logger.LogInformation("[AUTH] Dev Mode: Auto-confirming email for {Email} and issuing JWT", user.Email);
            var (accessToken, refreshToken) = await IssueTokenPairAsync(user);
            await _db.SaveChangesAsync(); // Save the new refresh token

            Response.Cookies.Append("refreshToken", refreshToken, RefreshCookieOptions());
            return Ok(new
            {
                accessToken,
                expiresIn = 900,
                user = UserDto(user)
            });
        }

        // Email confirmation — fire-and-forget
        _queue.EnqueueTask(async ct =>
        {
            try { await _email.SendEmailConfirmationAsync(user.Email, user.FullName, confirmToken, user.Email, ct); }
            catch (Exception ex) { _logger.LogError(ex, "[AUTH] Email confirm send failed for {Email}", user.Email); }
        });

        return StatusCode(201, new { message = "Vérifiez votre email pour confirmer votre compte." });
    }

    // ══════════════════════════════════════════════════════════
    //  GET /api/auth/confirm-email?token=&email=
    // ══════════════════════════════════════════════════════════

    [HttpGet("confirm-email")]
    [EnableRateLimiting("confirmEmail")]
    public async Task<IActionResult> ConfirmEmail(
    [FromQuery] string token, [FromQuery] string emailAddress)
    {
        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(emailAddress))
            return BadRequest(new { error = "Paramètres manquants." });

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == emailAddress.ToLower() &&
            u.EmailConfirmToken == token &&
            !u.IsDeleted);

        if (user is null)
            return BadRequest(new { error = "Lien de confirmation invalide." });

        if (user.EmailConfirmTokenExpiry < DateTime.UtcNow)
            return BadRequest(new { error = "Lien expiré. Demandez-en un nouveau." });

        user.IsEmailConfirmed = true;
        user.EmailConfirmToken = null;
        user.EmailConfirmTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        // Auto-login
        var (accessToken, refreshToken) = await IssueTokenPairAsync(user);
        await _db.SaveChangesAsync();

        // Welcome email fire-and-forget
        _queue.EnqueueTask(async ct =>
        {
            try { await _email.SendWelcomeAsync(user.Email, user.FullName, ct); }
            catch (Exception ex) { _logger.LogError(ex, "[AUTH] Welcome email failed for {Email}", user.Email); }
        });

        Response.Cookies.Append("refreshToken", refreshToken, RefreshCookieOptions());
        return Ok(new
        {
            accessToken,
            expiresIn = 900,
            user = UserDto(user)
        });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/login
    // ══════════════════════════════════════════════════════════

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new
            {
                errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
            });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == req.Email.ToLower() && !u.IsDeleted);

        // Lockout check
        if (user is not null && user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
        {
            var remaining = (int)Math.Ceiling((user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes);
            _logger.LogWarning("[AUTH] Login bloqué (lockout): {Email} | IP:{IP}", req.Email, ip);
            return StatusCode(429, new { error = $"Compte temporairement bloqué. Réessayez dans {remaining} min." });
        }

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            if (user is not null)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= 5)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                    user.FailedLoginCount = 0;
                    _logger.LogWarning("[SECURITY] Compte verrouillé 15 min: {Email} | IP:{IP}", req.Email, ip);
                }
                user.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            _logger.LogWarning("[AUTH] Échec login: {Email} | IP:{IP}", req.Email, ip);
            return Unauthorized(new { error = "Email ou mot de passe incorrect." });
        }

        // Reset lockout on success
        if (user.FailedLoginCount > 0 || user.LockoutEnd.HasValue)
        {
            user.FailedLoginCount = 0;
            user.LockoutEnd = null;
        }

        if (!user.IsEmailConfirmed)
            return StatusCode(403, new { error = "Confirmez votre email avant de vous connecter." });

        var (accessToken, refreshToken) = await IssueTokenPairAsync(user, ip, userAgent);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[AUTH] Login: {Email} | IP:{IP}", user.Email, ip);
        Response.Cookies.Append("refreshToken", refreshToken, RefreshCookieOptions());

        // Login alert désactivé — trop verbeux à chaque connexion.
        // Réactiver uniquement pour nouvelle IP/device inconnu (TODO v2).
        // var alertIp   = ip ?? "inconnu";
        // var alertUa   = userAgent;
        // var alertName = user.FullName;
        // var alertTo   = user.Email;
        // queue.EnqueueTask(async ct =>
        //     await email.SendLoginAlertAsync(alertTo, alertName, alertIp, alertUa, DateTime.UtcNow, ct));

        return Ok(new
        {
            accessToken,
            expiresIn = 900,
            user = UserDto(user)
        });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/refresh
    // ══════════════════════════════════════════════════════════

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
    {
        var rawRefreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(rawRefreshToken))
            return Unauthorized(new { error = "Session expirée, reconnectez-vous." });

        // Chercher le token en DB par son hash SHA-256
        var storedToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == HashRefreshToken(rawRefreshToken));

        // Token inconnu
        if (storedToken is null)
            return Unauthorized(new { error = "Session invalide." });

        // Theft detection : token déjà révoqué présenté à nouveau
        if (storedToken.IsRevoked)
        {
            _logger.LogWarning(
                "[SECURITY] Token reuse attack detected user={UserId} | tokenHash={Hash}",
                storedToken.UserId, HashRefreshToken(rawRefreshToken)[..12] + "...");
            await RevokeAllUserTokensAsync(storedToken.UserId);
            await _db.SaveChangesAsync();
            Response.Cookies.Delete("refreshToken");
            return Unauthorized(new { error = "Session compromise, reconnectez-vous." });
        }

        // Token expiré
        if (storedToken.ExpiryDate < DateTime.UtcNow)
        {
            storedToken.IsRevoked = true;
            await _db.SaveChangesAsync();
            return Unauthorized(new { error = "Session expirée, reconnectez-vous." });
        }

        // Valider que l'access token correspond bien à cet user
        if (!string.IsNullOrEmpty(req.AccessToken))
        {
            var principal = _tokens.GetPrincipalFromExpiredToken(req.AccessToken);
            var subClaim = principal?.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (subClaim != storedToken.UserId.ToString())
                return Unauthorized(new { error = "Token incohérent." });
        }

        // Rotation : révoquer l'ancien, émettre un nouveau pair
        storedToken.IsRevoked = true;
        var user = storedToken.User;
        var (newAccess, newRefresh) = await IssueTokenPairAsync(
            user,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString());
        await _db.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", newRefresh, RefreshCookieOptions());
        return Ok(new { accessToken = newAccess, expiresIn = 900 });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/logout
    // ══════════════════════════════════════════════════════════

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var rawToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(rawToken))
        {
            var token = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == HashRefreshToken(rawToken));
            if (token is not null) token.IsRevoked = true;
            await _db.SaveChangesAsync();
        }
        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Déconnecté." });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/forgot-password
    // ══════════════════════════════════════════════════════════

    [HttpPost("forgot-password")]
    [EnableRateLimiting("forgotPassword")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new
            {
                errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
            });

        // Réponse constante — ne jamais révéler si l'email existe
        const string safeMsg = "Si l'email existe, un lien de réinitialisation a été envoyé.";

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == req.Email.ToLower() && !u.IsDeleted);

        if (user is not null)
        {
            var resetToken = GenerateSecureToken();
            user.PasswordResetToken = resetToken;
            user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _queue.EnqueueTask(async ct =>
            {
                try { await _email.SendPasswordResetAsync(user.Email, user.FullName, resetToken, user.Email, ct); }
                catch (Exception ex) { _logger.LogError(ex, "[AUTH] Reset email failed for {Email}", user.Email); }
            });
        }

        return Ok(new { message = safeMsg });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/reset-password
    // ══════════════════════════════════════════════════════════

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new
            {
                errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
            });

        if (!Regex.IsMatch(req.NewPassword, @"^(?=.*[A-Z])(?=.*\d).{8,}$"))
            return BadRequest(new { error = "Le nouveau mot de passe doit faire au moins 8 caractères avec 1 majuscule et 1 chiffre." });

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == req.Email.ToLower() &&
            u.PasswordResetToken == req.Token &&
            !u.IsDeleted);

        if (user is null)
            return BadRequest(new { error = "Lien de réinitialisation invalide." });

        if (user.PasswordResetExpiry < DateTime.UtcNow)
            return BadRequest(new { error = "Lien expiré. Demandez-en un nouveau." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 12);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        // Révoquer tous les refresh tokens
        await RevokeAllUserTokensAsync(user.Id);
        await _db.SaveChangesAsync();

        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Mot de passe mis à jour. Reconnectez-vous." });
    }

    // ══════════════════════════════════════════════════════════
    //  POST /api/auth/resend-confirmation
    // ══════════════════════════════════════════════════════════

    [HttpPost("resend-confirmation")]
    [EnableRateLimiting("confirmEmail")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendRequest req)
    {
        if (!ModelState.IsValid)
            return Ok(new { message = "Si l'email existe, un nouveau lien a été envoyé." });

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == req.Email.ToLower() &&
            !u.IsEmailConfirmed &&
            !u.IsDeleted);

        if (user is not null)
        {
            var token = GenerateSecureToken();
            user.EmailConfirmToken = token;
            user.EmailConfirmTokenExpiry = DateTime.UtcNow.AddHours(24);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _queue.EnqueueTask(async ct =>
            {
                try { await _email.SendEmailConfirmationAsync(user.Email, user.FullName, token, user.Email, ct); }
                catch (Exception ex) { _logger.LogError(ex, "[AUTH] Resend confirm failed for {Email}", user.Email); }
            });
        }

        return Ok(new { message = "Si l'email existe, un nouveau lien a été envoyé." });
    }

    // ══════════════════════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════════════════════

    private Task<(string AccessToken, string RefreshToken)> IssueTokenPairAsync(
        AppUser user, string? ip = null, string? ua = null)
    {
        var accessToken = _tokens.GenerateAccessToken(user);
        var refreshToken = _tokens.GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = HashRefreshToken(refreshToken), // store SHA-256 hash, never the raw token
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            IpAddress = ip?[..Math.Min(64, ip.Length)],
            UserAgent = ua?[..Math.Min(512, ua.Length)],
        });

        return Task.FromResult((accessToken, refreshToken)); // return raw token to send as cookie
    }

    private async Task RevokeAllUserTokensAsync(int userId)
    {
        var userTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();
        foreach (var t in userTokens)
            t.IsRevoked = true;
    }

    private static string GenerateSecureToken()
        => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    /// <summary>SHA-256 hash of a raw refresh token — the DB never stores raw tokens.</summary>
    private static string HashRefreshToken(string rawToken)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }

    // ══════════════════════════════════════════════════════════
    //  GET /api/auth/test-email?to=your@email.com  (dev only)
    // ══════════════════════════════════════════════════════════

    [HttpGet("test-email")]
    [AllowAnonymous]
    public async Task<IActionResult> TestEmail(
        [FromQuery] string to = "test@example.com")
    {
        if (!_env.IsDevelopment())
            return NotFound();
        await _email.SendEmailConfirmationAsync(to, "Jonathan", "test-token-123", to);
        return Ok(new { sent = true, to });
    }

    private static object UserDto(AppUser u) => new
    {
        id = u.Id,
        email = u.Email,
        name = u.FullName,
        role = u.Role
    };
}

// ──────────────────────────────────────────────
//  Request DTOs avec DataAnnotations
// ──────────────────────────────────────────────

public record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(2), MaxLength(128)] string FullName,
    [Required, MinLength(8), MaxLength(128)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RefreshRequest(string? AccessToken = null);

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email
);

public record ResetPasswordRequest(
    [Required, EmailAddress] string Email,
    [Required] string Token,
    [Required, MinLength(8)] string NewPassword
);

public record ResendRequest(
    [Required, EmailAddress] string Email
);
