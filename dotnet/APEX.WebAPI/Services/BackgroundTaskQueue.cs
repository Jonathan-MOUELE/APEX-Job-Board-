// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — BackgroundTaskQueue                           ║
// ║  Fire-and-forget pour envoi emails (ne bloque pas l'API).   ║
// ╚══════════════════════════════════════════════════════════════╝

using System.Threading.Channels;
using APEX.Core;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace APEX.WebAPI.Services;

/// <summary>Queue Channel pour tâches asynchrones (emails).</summary>
public sealed class BackgroundTaskQueue : IBackgroundTaskQueue
{
    private readonly Channel<Func<CancellationToken, Task>> _channel =
        Channel.CreateBounded<Func<CancellationToken, Task>>(
            new BoundedChannelOptions(200) { FullMode = BoundedChannelFullMode.Wait });

    public void EnqueueTask(Func<CancellationToken, Task> task)
        => _channel.Writer.TryWrite(task);

    public async Task<Func<CancellationToken, Task>> DequeueAsync(CancellationToken ct)
        => await _channel.Reader.ReadAsync(ct);
}

/// <summary>Hosted service qui consomme la queue en arrière-plan.</summary>
public sealed class EmailQueueHostedService(
    IBackgroundTaskQueue queue,
    ILogger<EmailQueueHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("[EMAIL-QUEUE] Service démarré.");
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var task = await queue.DequeueAsync(ct);
                await task(ct);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "[EMAIL-QUEUE] Erreur lors du traitement d'un email.");
            }
        }
        logger.LogInformation("[EMAIL-QUEUE] Service arrêté.");
    }
}
