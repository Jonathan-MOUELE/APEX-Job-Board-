// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — ServiceCollectionExtensions V1        ║
// ╚══════════════════════════════════════════════════════════════╝

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using APEX.Core;
using APEX.Infrastructure.Data;

namespace APEX.Infrastructure;

public static class ServiceCollectionExtensions
{
    /// <summary>Enregistre le DbContext SQLite.</summary>
    public static IServiceCollection AddApexDatabase(
        this IServiceCollection services,
        IConfiguration config)
    {
        var connStr = config.GetConnectionString("ApexDb");
        services.AddDbContext<ApexDbContext>(opts =>
            opts.UseSqlServer(connStr));
        return services;
    }

    /// <summary>Enregistre le client France Travail avec HttpClientFactory.</summary>
    public static IServiceCollection AddFranceTravailClient(
        this IServiceCollection services,
        IConfiguration config)
    {
        services.Configure<FranceTravailOptions>(
            config.GetSection(FranceTravailOptions.SectionName));

        // Client nommé pour les appels search (Accept: application/json)
        services.AddHttpClient("FranceTravail", c =>
        {
            c.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            c.Timeout = TimeSpan.FromSeconds(10);
        });

        // FranceTravailClient en Singleton (cache mémoire token + résultats)
        services.AddSingleton<IJobService, FranceTravailClient>();

        return services;
    }
}
