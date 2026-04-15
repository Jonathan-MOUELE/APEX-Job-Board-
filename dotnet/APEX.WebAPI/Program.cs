// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — Program.cs V1 Production                      ║
// ║  Env vars first, rate limiting, security headers,            ║
// ║  exception handler, health check, static files              ║
// ╚══════════════════════════════════════════════════════════════╝

using System.Threading.RateLimiting;
using APEX.Agents;
using APEX.Core;
using APEX.Infrastructure;
using APEX.Infrastructure.Data;
using APEX.WebAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

// ── 1. Configuration (env vars FIRST) ──────────────────────────
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables(); // Priorité absolue
builder.WebHost.ConfigureKestrel(o => o.AddServerHeader = false);

// ── 2. Controllers + JSON ────────────────────────────────────────
builder.Services.AddControllers(opts =>
{
    opts.Filters.Add(new Microsoft.AspNetCore.Mvc.ProducesAttribute("application/json"));
})
.AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.DefaultIgnoreCondition =
        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// ── 3. Swagger ───────────────────────────────────────────────────
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "APEX API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header
    });
    c.AddSecurityRequirement(new()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            []
        }
    });
});

// ── 4. EF Core SQLite ────────────────────────────────────────────
builder.Services.AddApexDatabase(builder.Configuration);

// ── 5. France Travail Client ─────────────────────────────────────────
builder.Services.AddFranceTravailClient(builder.Configuration);

// ── 5b. External APIs (Arbeitnow + The Muse + Adzuna) ────────────
builder.Services.AddSingleton<APEX.Infrastructure.ExternalApis.ArbeitnowClient>();
builder.Services.AddSingleton<APEX.Infrastructure.ExternalApis.MuseClient>();
builder.Services.Configure<APEX.Infrastructure.ExternalApis.AdzunaOptions>(
    builder.Configuration.GetSection(APEX.Infrastructure.ExternalApis.AdzunaOptions.SectionName));
builder.Services.AddSingleton<APEX.Infrastructure.ExternalApis.AdzunaClient>();

// ── 6. AI Settings + AnalystAgent + CvParserAgent ───────────────
builder.Services.Configure<AiSettings>(
    builder.Configuration.GetSection(AiSettings.SectionName));
builder.Services.AddSingleton<IAgentAnalyst, AnalystAgent>();
builder.Services.AddScoped<CvParserAgent>();

// Expose AiSettings directement pour JobsController
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiSettings>>().Value);

// ── 7. Auth Services ─────────────────────────────────────────────
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<FrontendSettings>(builder.Configuration.GetSection("Frontend"));
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
builder.Services.AddHostedService<EmailQueueHostedService>();
// Alerte email digest — worker en arrière-plan (IHostedService)
builder.Services.AddHostedService<AlertWorker>();

// ── 8. JWT Authentication ────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret manquant dans la configuration.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "apex-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "apex-web";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero  // Pas de tolérance
        };
        opts.Events = new JwtBearerEvents
        {
            OnChallenge = ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode = 401;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync("{\"error\":\"Non authentifié.\"}");
            },
            OnForbidden = ctx =>
            {
                ctx.Response.StatusCode = 403;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync("{\"error\":\"Accès refusé.\"}");
            }
        };
    });

builder.Services.AddAuthorization();

// ── 9. CORS depuis configuration ─────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost"];


builder.Services.AddCors(options =>
{
    options.AddPolicy("ApexPolicy", policy =>
    {
        policy
          .WithOrigins(
            "http://localhost",
            "http://localhost:80",
            "http://127.0.0.1",
            "http://localhost:5188",
            "http://localhost:5191"
          // NOTE: "null" origin intentionally excluded — would allow file:// and sandboxed iframes
          )
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials();
    });
});


// ── 10. Rate Limiting (.NET 9 natif) ─────────────────────────────
builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = 429;
    opts.OnRejected = async (ctx, _) =>
    {
        ctx.HttpContext.Response.ContentType = "application/json";
        await ctx.HttpContext.Response.WriteAsync(
            "{\"error\":\"Trop de requêtes. Réessayez dans quelques secondes.\"}");
    };

    // Login : 5 req/min par IP
    opts.AddFixedWindowLimiter("login", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Register : 3 req/min par IP
    opts.AddFixedWindowLimiter("register", o =>
    {
        o.PermitLimit = 3;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });

    // Forgot password : 3 req/min par IP
    opts.AddFixedWindowLimiter("forgotPassword", o =>
    {
        o.PermitLimit = 3;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });

    // Confirm email : 10 req/min par IP
    opts.AddFixedWindowLimiter("confirmEmail", o =>
    {
        o.PermitLimit = 10;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });

    // Search : 30 req/min
    opts.AddFixedWindowLimiter("search", o =>
    {
        o.PermitLimit = 30;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });

    // Chat : 20 req/min
    opts.AddFixedWindowLimiter("chat", o =>
    {
        o.PermitLimit = 20;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });

    // Analyze : 10 req/min
    opts.AddFixedWindowLimiter("analyze", o =>
    {
        o.PermitLimit = 10;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });

    // Analyze batch : 5 req/min
    opts.AddFixedWindowLimiter("analyzeBatch", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });
});

// ── 11. Health Checks ────────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApexDbContext>("database");

// ════════════════════════════════════════════════════════════════
//  BUILD
// ════════════════════════════════════════════════════════════════
var app = builder.Build();

// ── 12. Exception Handler (jamais de stack trace client) ─────────
app.UseExceptionHandler(errApp =>
{
    errApp.Run(async ctx =>
    {
        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        var traceId = System.Diagnostics.Activity.Current?.Id
                   ?? ctx.TraceIdentifier;
        await ctx.Response.WriteAsync(
            $"{{\"error\":\"Erreur interne du serveur.\",\"traceId\":\"{traceId}\"}}");
    });
});

// ── 13. Security Headers (inline, pas de package tiers) ─────────
app.Use(async (ctx, next) =>
{
    var h = ctx.Response.Headers;
    h["X-Content-Type-Options"] = "nosniff";
    h["X-Frame-Options"] = "DENY";
    h["X-XSS-Protection"] = "0"; // Désactivé : CSP est la vraie protection XSS
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";

    // HSTS — uniquement en production (HTTPS)
    if (ctx.Request.IsHttps)
        h["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";

    // Content-Security-Policy
    h["Content-Security-Policy"] =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' http://localhost:5191 http://localhost:5188; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';";

    // Supprimer les headers verbaux
    h.Remove("Server");
    h.Remove("X-Powered-By");
    h.Remove("X-AspNet-Version");

    // Cache-Control sur les routes auth
    if (ctx.Request.Path.StartsWithSegments("/api/auth"))
        h["Cache-Control"] = "no-store";

    await next();
});

// ── 14. Cookie Policy ────────────────────────────────────────────
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Strict,
    Secure = app.Environment.IsProduction()
        ? CookieSecurePolicy.Always
        : CookieSecurePolicy.SameAsRequest
});

// ── 15. Dev-only : Swagger + auto-migration ──────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "APEX API v1"));

    using var devScope = app.Services.CreateScope();
    var db = devScope.ServiceProvider.GetRequiredService<ApexDbContext>();
    var startupLogger = devScope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        startupLogger.LogWarning(ex, "[STARTUP] Auto-migration skipped because SQL Server is unavailable.");
    }
}

// ── 16. Middlewares dans le bon ordre ────────────────────────────
app.UseCors("ApexPolicy"); // CORS must be first — before auth & rate limiting
app.UseRateLimiter();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── 17. Health endpoint ──────────────────────────────────────────
app.MapGet("/health", async (ApexDbContext db, IConfiguration cfg) =>
{
    var checks = new Dictionary<string, string>();

    // DB
    try
    {
        await db.Database.ExecuteSqlRawAsync("SELECT 1");
        checks["db"] = "healthy";
    }
    catch { checks["db"] = "unhealthy"; }

    // Gemini ping (juste vérifier que la clé est configurée)
    checks["gemini"] = !string.IsNullOrEmpty(cfg["Gemini:ApiKey"]) &&
                       !cfg["Gemini:ApiKey"]!.StartsWith("DEV_ONLY")
                       ? "configured" : "missing_key";

    // FT clé présente
    checks["franceTravail"] = !string.IsNullOrEmpty(cfg["FranceTravailApi:ClientSecret"]) &&
                              !cfg["FranceTravailApi:ClientSecret"]!.StartsWith("DEV_ONLY")
                              ? "configured" : "missing_secret";

    var allHealthy = checks["db"] == "healthy";
    return Results.Json(new
    {
        status = allHealthy ? "healthy" : "degraded",
        checks,
        timestamp = DateTime.UtcNow
    }, statusCode: allHealthy ? 200 : 503);
});

// ── 18. Seed Admin ───────────────────────────────────────────────
try
{
    await DbSeeder.SeedAdminAsync(app);
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "[STARTUP] Admin seed skipped because database is unavailable.");
}

app.Run();
