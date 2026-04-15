// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — AlertWorker (IHostedService)                  ║
// ║  Vérifie les alertes toutes les heures, envoie le digest     ║
// ╚══════════════════════════════════════════════════════════════╝

using APEX.Core;
using APEX.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace APEX.WebAPI.Services;

public sealed class AlertWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AlertWorker> _logger;

    // Check interval — hourly in prod, 5 min in dev
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    public AlertWorker(IServiceScopeFactory scopeFactory, ILogger<AlertWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[ALERTS] Worker démarré — intervalle {H}h", Interval.TotalHours);

        // Initial delay: wait 2 min after startup before first check
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcessDueAlertsAsync(stoppingToken); }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ALERTS] Worker error — retry in {H}h", Interval.TotalHours);
            }
            await Task.Delay(Interval, stoppingToken);
        }

        _logger.LogInformation("[ALERTS] Worker arrêté.");
    }

    private async Task ProcessDueAlertsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db          = scope.ServiceProvider.GetRequiredService<ApexDbContext>();
        var jobService  = scope.ServiceProvider.GetRequiredService<IJobService>();
        var emailSvc    = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;

        var dueAlerts = await db.SearchAlerts
            .Where(a => a.IsActive && (
                (a.Frequency == "daily"  && (a.LastSentAt == null || a.LastSentAt < now.AddHours(-23))) ||
                (a.Frequency == "weekly" && (a.LastSentAt == null || a.LastSentAt < now.AddDays(-6.5)))
            ))
            .Include(a => a.User)
            .Take(50)
            .ToListAsync(ct);

        if (dueAlerts.Count == 0)
        {
            _logger.LogDebug("[ALERTS] Aucune alerte due.");
            return;
        }

        _logger.LogInformation("[ALERTS] {N} alertes dues.", dueAlerts.Count);

        foreach (var alert in dueAlerts)
        {
            try
            {
                var jobs = await jobService.SearchJobsAsync(
                    alert.Keywords, alert.Location, alert.ContractType, "0-4", ct);

                if (jobs.Count == 0) { _logger.LogDebug("[ALERTS] No results for alert {Id}.", alert.Id); continue; }

                await emailSvc.SendAlertDigestAsync(
                    alert.User.Email, alert.User.FullName,
                    alert.Keywords, jobs, ct);

                alert.LastSentAt = now;
                _logger.LogInformation("[ALERTS] Digest sent for alert {Id} ({Kw}).", alert.Id, alert.Keywords);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ALERTS] Failed to process alert {Id}.", alert.Id);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
