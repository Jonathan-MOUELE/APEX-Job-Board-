// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — DbSeeder V1                           ║
// ║  Seed admin sans hardcoding de hash statique.                ║
// ╚══════════════════════════════════════════════════════════════╝

using APEX.Core.Entities;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace APEX.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(IHost app)
    {
        using var scope = app.Services.CreateScope();
        var ctx    = scope.ServiceProvider.GetRequiredService<ApexDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApexDbContext>>();

        try
        {
            const string adminEmail = "admin@avers.fr";
            if (!await ctx.Users.AnyAsync(u => u.Email == adminEmail))
            {
                logger.LogInformation("[SEEDER] Creating APEX admin account...");
                ctx.Users.Add(new AppUser
                {
                    Email             = adminEmail,
                    FullName          = "Admin APEX",
                    PasswordHash      = BCrypt.Net.BCrypt.HashPassword("ChangeMe_APEX2026!", workFactor: 12),
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
