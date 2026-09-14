// ╔══════════════════════════════════════════════════════════════
// ║  APEX.Infrastructure — DbSeeder V1                           ║
// ║  Seed admin sans hardcoding de hash statique.                ║
// ╚═════════════════════════════════════════════════════════════╝

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
        using var scope = app.Services.CreateScope();
        var ctx    = scope.ServiceProvider.GetRequiredService<ApexDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApexDbContext>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        try
        {
            const string adminEmail = "admin@avers.fr";
            if (!await ctx.Users.AnyAsync(u => u.Email == adminEmail))
            {
                // Lire le mot de passe admin depuis la variable d'environnement
                // Variable : APEX__AdminPassword (ou Apex:AdminPassword dans appsettings)
                var adminPassword = config["Apex:AdminPassword"]
                    ?? Environment.GetEnvironmentVariable("APEX__AdminPassword");

                if (string.IsNullOrWhiteSpace(adminPassword))
                {
                    // En l'absence de config, générer un mot de passe aléatoire et le logger UNE seule fois
                    adminPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24));
                    logger.LogWarning(
                        "[SEEDER] APEX__AdminPassword non configuré. Mot de passe temporaire généré : {Pwd}" +
                        " — Changez-le immédiatement via /api/auth/reset-password !",
                        adminPassword);
                }

                logger.LogInformation("[SEEDER] Creating APEX admin account...");
                ctx.Users.Add(new AppUser
                {
                    Email             = adminEmail,
                    FullName          = "Admin APEX",
                    PasswordHash      = BCrypt.Net.BCrypt.HashPassword(adminPassword, workFactor: 12),
                    Role              = "admin",
                    IsEmailConfirmed  = true,
                    CreatedAt         = DateTime.UtcNow,
                    UpdatedAt         = DateTime.UtcNow
                });
                await ctx.SaveChangesAsync();
                logger.LogInformation("[SEEDER] Admin account created — email: {Email}", adminEmail);
            }
            else
            {
                logger.LogDebug("[SEEDER] Admin account already exists.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[SEEDER] Error during database seeding.");
        }
    }
}
