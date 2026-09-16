// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — DbSeeder V2                           ║
// ║  Seed admin + utilisateur de développement au 1er démarrage  ║
// ║  Aucun hash statique — BCrypt runtime.                        ║
// ╚══════════════════════════════════════════════════════════════╝

using APEX.Core.Entities;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace APEX.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(IHost app)
    {
        using var scope  = app.Services.CreateScope();
        var ctx    = scope.ServiceProvider.GetRequiredService<ApexDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApexDbContext>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        try
        {
            // ── Appliquer les migrations automatiquement si nécessaire ────────
            await ctx.Database.MigrateAsync();

            // ─── Seed Admin ──────────────────────────────────────────────────
            await SeedUserAsync(ctx, logger, config,
                email:    "admin@avers.fr",
                fullName: "Admin APEX",
                role:     "admin",
                plan:     "Ultra",
                confirmed: true,
                configPasswordKey: "Apex:AdminPassword",
                envVar:   "APEX__AdminPassword",
                warnIfMissing: true);

            // ─── Seed Développeur (Jonathan) ─────────────────────────────────
            await SeedUserAsync(ctx, logger, config,
                email:    "jonathanmouele42@gmail.com",
                fullName: "Jonathan Mouele",
                role:     "user",
                plan:     "Free",
                confirmed: true,
                configPasswordKey: "Apex:DevPassword",
                envVar:   "APEX__DevPassword",
                warnIfMissing: false,
                fallbackPassword: "Apex@Dev2026!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[SEEDER] Erreur lors du seeding de la base de données.");
        }
    }

    // ── Méthode générique de seeding d'un utilisateur ────────────────────────
    private static async Task SeedUserAsync(
        ApexDbContext ctx,
        ILogger logger,
        IConfiguration config,
        string email,
        string fullName,
        string role,
        string plan,
        bool   confirmed,
        string configPasswordKey,
        string envVar,
        bool   warnIfMissing,
        string? fallbackPassword = null)
    {
        // Résoudre le mot de passe : config → env → fallback → généré
        var password = config[configPasswordKey]
                    ?? Environment.GetEnvironmentVariable(envVar);

        var existingUser = await ctx.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existingUser != null)
        {
            // Si un mot de passe explicite est fourni et ne correspond pas au hash en DB, on le resynchronise
            if (!string.IsNullOrWhiteSpace(password) && !BCrypt.Net.BCrypt.Verify(password, existingUser.PasswordHash))
            {
                logger.LogInformation("[SEEDER] Resynchronisation du mot de passe pour {Email}...", email);
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
                existingUser.IsEmailConfirmed = confirmed;
                existingUser.LockoutEnd = null;
                existingUser.FailedLoginCount = 0;
                existingUser.UpdatedAt = DateTime.UtcNow;
                await ctx.SaveChangesAsync();
                logger.LogInformation("[SEEDER] Mot de passe synchronisé avec succès pour {Email}.", email);
            }
            else
            {
                logger.LogDebug("[SEEDER] Compte {Email} déjà à jour.", email);
            }
            return;
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            if (!string.IsNullOrWhiteSpace(fallbackPassword))
            {
                password = fallbackPassword;
                logger.LogInformation("[SEEDER] {Email} — mot de passe par défaut utilisé ({Key}).",
                    email, configPasswordKey);
            }
            else
            {
                password = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24));
                if (warnIfMissing)
                    logger.LogWarning(
                        "[SEEDER] {Key} non configuré. Mot de passe temporaire généré : {Pwd}" +
                        " — Changez-le immédiatement via /api/auth/reset-password !",
                        configPasswordKey, password);
            }
        }

        logger.LogInformation("[SEEDER] Création du compte {Email}...", email);
        ctx.Users.Add(new AppUser
        {
            Email             = email,
            FullName          = fullName,
            PasswordHash      = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12),
            Role              = role,
            SubscriptionStatus = plan,
            IsEmailConfirmed  = confirmed,
            CreatedAt         = DateTime.UtcNow,
            UpdatedAt         = DateTime.UtcNow
        });
        await ctx.SaveChangesAsync();
        logger.LogInformation("[SEEDER] ✓ Compte créé — email: {Email} | rôle: {Role}", email, role);
    }
}
