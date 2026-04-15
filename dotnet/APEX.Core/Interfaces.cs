// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Core — Interfaces V1 Production                        ║
// ╚══════════════════════════════════════════════════════════════╝

namespace APEX.Core;

/// <summary>
/// Service de recherche d'offres d'emploi (France Travail).
/// </summary>
public interface IJobService
{
    Task<IReadOnlyList<JobOffer>> SearchJobsAsync(
        string keywords,
        string? location = null,
        string? contractType = null,
        string range = "0-14",
        CancellationToken ct = default);
}

/// <summary>
/// Agent d'analyse sémantique offre vs profil.
/// </summary>
public interface IAgentAnalyst
{
    Task<MatchResult> AnalyzeAsync(
        JobOffer job,
        CandidateProfile profile,
        CancellationToken ct = default);
}

/// <summary>
/// Service d'envoi d'emails transactionnels (MailKit).
/// </summary>
public interface IEmailService
{
    Task SendEmailConfirmationAsync(
        string to, string name, string token, string email,
        CancellationToken ct = default);

    Task SendPasswordResetAsync(
        string to, string name, string token, string email,
        CancellationToken ct = default);

    Task SendWelcomeAsync(
        string to, string name,
        CancellationToken ct = default);

    Task SendAlertDigestAsync(
        string to, string name, string keywords,
        IReadOnlyList<JobOffer> jobs,
        CancellationToken ct = default);

    /// <summary>Alerte de connexion — envoyée après chaque login réussi.</summary>
    Task SendLoginAlertAsync(
        string to, string name,
        string ipAddress, string device, DateTime loginTimeUtc,
        CancellationToken ct = default);

    /// <summary>Newsletter générique — expédiée par l'admin ou un job planifié.</summary>
    Task SendNewsletterAsync(
        string to, string name,
        string subject, string htmlContent,
        CancellationToken ct = default);
}

/// <summary>
/// Queue de tâches arrière-plan pour fire-and-forget (emails).
/// </summary>
public interface IBackgroundTaskQueue
{
    void EnqueueTask(Func<CancellationToken, Task> task);
    Task<Func<CancellationToken, Task>> DequeueAsync(CancellationToken ct);
}
