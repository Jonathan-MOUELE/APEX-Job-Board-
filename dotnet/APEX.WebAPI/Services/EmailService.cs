// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — EmailService V2 Production                    ║
// ║  MailKit + MimeKit + Polly retry — Gmail/Outlook/SMTP        ║
// ║  IOptions<SmtpSettings> + IOptions<FrontendSettings>         ║
// ║  Multipart/alternative (plain-text + HTML), light theme      ║
// ╚══════════════════════════════════════════════════════════════╝

using System.Net.Sockets;
using APEX.Core;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Polly;
using Polly.Retry;

namespace APEX.WebAPI.Services;

public sealed class EmailService(
    IOptions<SmtpSettings>   smtpOpts,
    IOptions<FrontendSettings> frontendOpts,
    ILogger<EmailService>    logger) : IEmailService
{
    private readonly SmtpSettings    _smtp     = smtpOpts.Value;
    private readonly FrontendSettings _frontend = frontendOpts.Value;

    // ── Polly retry : 3 tentatives, backoff 2s / 4s / 8s ──────────
    // Only transient network/SMTP errors are retried — not auth failures.
    private readonly AsyncRetryPolicy _retryPolicy = Policy
        .Handle<SmtpCommandException>(ex => (int)ex.StatusCode >= 400 && (int)ex.StatusCode < 500
            ? false   // 4xx = permanent auth/config error → don't retry
            : true)
        .Or<SocketException>()
        .Or<System.IO.IOException>()
        .WaitAndRetryAsync(
            3,
            attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
            (ex, delay, attempt, _) =>
            { /* logged in SendAsync */ });

    // ══════════════════════════════════════════════════════════
    //  Email Confirmation
    // ══════════════════════════════════════════════════════════

    public async Task SendEmailConfirmationAsync(
        string to, string name, string token, string email,
        CancellationToken ct = default)
    {
        var encodedEmail = Uri.EscapeDataString(email);
        var encodedToken = Uri.EscapeDataString(token);
        var confirmUrl   = $"{_frontend.BaseUrl}/register.html?action=confirm&token={encodedToken}&email={encodedEmail}";

        var body = $"""
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">
              Bienvenue, {System.Net.WebUtility.HtmlEncode(name)} !
            </h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Votre compte APEX est presque prêt.
              Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="{confirmUrl}"
                 style="background:linear-gradient(135deg,#fe9400,#ff8e80);
                        color:#ffffff;text-decoration:none;padding:16px 40px;
                        border-radius:12px;font-weight:800;font-size:15px;
                        display:inline-block;">
                Confirmer mon compte →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:13px;line-height:1.5;
                      border-top:1px solid #f1f5f9;padding-top:20px;margin:0;">
              Ce lien expire dans <strong>24 heures</strong>.<br/>
              Si vous n'avez pas créé de compte APEX, ignorez cet email.
            </p>
            """;

        await SendAsync(
            to, name,
            subject: "Confirmez votre compte APEX 🚀",
            body: WrapInBase(body),
            ct);
    }

    // ══════════════════════════════════════════════════════════
    //  Password Reset
    // ══════════════════════════════════════════════════════════

    public async Task SendPasswordResetAsync(
        string to, string name, string token, string email,
        CancellationToken ct = default)
    {
        var encodedEmail = Uri.EscapeDataString(email);
        var encodedToken = Uri.EscapeDataString(token);
        var resetUrl     = $"{_frontend.BaseUrl}/register.html?action=reset&token={encodedToken}&email={encodedEmail}";

        var body = $"""
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">
              Réinitialisez votre mot de passe
            </h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Vous avez demandé à réinitialiser votre mot de passe APEX.
              Ce lien est valable <strong>1 heure</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="{resetUrl}"
                 style="background:#0f172a;color:#ffffff;text-decoration:none;
                        padding:16px 40px;border-radius:12px;font-weight:800;
                        font-size:15px;display:inline-block;">
                Réinitialiser mon mot de passe →
              </a>
            </div>
            <p style="color:#ef4444;font-size:13px;font-weight:600;margin:0 0 8px;">
              ⚠️ Si vous n'avez pas fait cette demande,
              changez votre mot de passe immédiatement.
            </p>
            """;

        await SendAsync(
            to, name,
            subject: "Réinitialisation de votre mot de passe APEX",
            body: WrapInBase(body),
            ct);
    }

    // ══════════════════════════════════════════════════════════
    //  Welcome Email
    // ══════════════════════════════════════════════════════════

    public async Task SendWelcomeAsync(
        string to, string name,
        CancellationToken ct = default)
    {
        var body = $"""
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">
              C'est parti, {System.Net.WebUtility.HtmlEncode(name)} ! 🎉
            </h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Votre compte est activé. Importez votre CV pour activer
              le matching IA personnalisé et découvrez les offres
              qui vous correspondent vraiment.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="{_frontend.BaseUrl}"
                 style="background:linear-gradient(135deg,#fe9400,#ff8e80);
                        color:#ffffff;text-decoration:none;padding:16px 40px;
                        border-radius:12px;font-weight:800;font-size:15px;
                        display:inline-block;">
                Découvrir mes offres →
              </a>
            </div>
            """;

        await SendAsync(
            to, name,
            subject: "Votre compte APEX est activé 🎉",
            body: WrapInBase(body),
            ct);
    }

    // ══════════════════════════════════════════════════════════
    //  Alert Digest Email
    // ══════════════════════════════════════════════════════════

    public async Task SendAlertDigestAsync(
        string to, string name, string keywords,
        IReadOnlyList<APEX.Core.JobOffer> jobs,
        CancellationToken ct = default)
    {
        var jobRows = new System.Text.StringBuilder();
        foreach (var j in jobs.Take(5))
        {
            var sal = j.SalaryLabel is not null ? $"<span style='color:#ff8e80;font-weight:600;'>{System.Net.WebUtility.HtmlEncode(j.SalaryLabel)}</span> · " : "";
            var url = System.Net.WebUtility.HtmlEncode(j.OriginUrl ?? _frontend.BaseUrl);
            jobRows.Append($"""
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;">
                      <a href="{url}" style="color:#0f172a;text-decoration:none;">{System.Net.WebUtility.HtmlEncode(j.Title)}</a>
                    </p>
                    <p style="margin:0;font-size:12px;color:#64748b;">
                      {System.Net.WebUtility.HtmlEncode(j.Company)} · {System.Net.WebUtility.HtmlEncode(j.Location)} · {sal}{System.Net.WebUtility.HtmlEncode(j.ContractType)}
                    </p>
                  </td>
                </tr>
            """);
        }

        var htmlBody = $"""
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"/><title>Nouvelles offres APEX</title></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="padding:28px 40px 20px;border-bottom:1px solid #f1f5f9;">
                        <div style="font-size:26px;font-weight:800;color:#ff8e80;letter-spacing:-0.03em;">APEX</div>
                        <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">by AVERS</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px 40px;">
                        <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">
                          Nouvelles offres pour « {System.Net.WebUtility.HtmlEncode(keywords)} »
                        </h1>
                        <p style="margin:0 0 24px;font-size:14px;color:#475569;">
                          Bonjour {System.Net.WebUtility.HtmlEncode(name)}, voici les {jobs.Count} dernières offres correspondant à votre alerte.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">{jobRows}</table>
                        <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                          <tr>
                            <td style="border-radius:10px;background:#ff8e80;">
                              <a href="{_frontend.BaseUrl}?kw={Uri.EscapeDataString(keywords)}"
                                 style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">
                                Voir toutes les offres
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;">
                          Vous recevez ce digest car vous avez créé une alerte APEX pour « {System.Net.WebUtility.HtmlEncode(keywords)} ».<br/>
                          © AVERS — APEX Platform.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await SendAsync(
            to, name,
            subject: $"APEX Alerte — {jobs.Count} nouvelle{(jobs.Count > 1 ? "s" : "")} offre{(jobs.Count > 1 ? "s" : "")} pour « {keywords} »",
            body: htmlBody,
            ct);
    }

    // ══════════════════════════════════════════════════════════
    //  Login Alert
    // ══════════════════════════════════════════════════════════

    public async Task SendLoginAlertAsync(
        string to, string name,
        string ipAddress, string device, DateTime loginTimeUtc,
        CancellationToken ct = default)
    {
        var safeIp     = System.Net.WebUtility.HtmlEncode(ipAddress);
        var safeDevice = System.Net.WebUtility.HtmlEncode(
            device.Length > 120 ? device[..120] + "…" : device);
        var localTime  = loginTimeUtc.ToString("dd/MM/yyyy à HH:mm") + " UTC";
        var resetUrl   = $"{_frontend.BaseUrl}/register.html?action=forgot";

        var body = $"""
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">
              Nouvelle connexion détectée
            </h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Bonjour <strong>{System.Net.WebUtility.HtmlEncode(name)}</strong>,
              une connexion à votre compte APEX vient d'être enregistrée.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 14px;color:#64748b;font-weight:600;border-radius:8px 0 0 0;width:38%;">📅 Date</td>
                <td style="padding:10px 14px;color:#0f172a;">{localTime}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;color:#64748b;font-weight:600;">🌐 Adresse IP</td>
                <td style="padding:10px 14px;color:#0f172a;">{safeIp}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:10px 14px;color:#64748b;font-weight:600;border-radius:0 0 0 8px;">💻 Appareil</td>
                <td style="padding:10px 14px;color:#0f172a;">{safeDevice}</td>
              </tr>
            </table>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Si cette connexion vient bien de vous, aucune action n'est nécessaire.
            </p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;
                        padding:16px 20px;margin:0 0 28px;">
              <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">
                ⚠️ Ce n'est pas vous ? Sécurisez votre compte immédiatement.
              </p>
            </div>
            <div style="text-align:center;margin:0 0 12px;">
              <a href="{resetUrl}"
                 style="background:#ef4444;color:#ffffff;text-decoration:none;
                        padding:14px 36px;border-radius:12px;font-weight:800;
                        font-size:14px;display:inline-block;">
                Changer mon mot de passe →
              </a>
            </div>
            """;

        await SendAsync(
            to, name,
            subject: "Nouvelle connexion à votre compte APEX 🔐",
            body: WrapInBase(body),
            ct);
    }

    // ══════════════════════════════════════════════════════════
    //  Newsletter
    // ══════════════════════════════════════════════════════════

    public async Task SendNewsletterAsync(
        string to, string name,
        string subject, string htmlContent,
        CancellationToken ct = default)
    {
        // htmlContent is already a full HTML block; wrap it in the branded base.
        var body = $"""
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:800;">
              {System.Net.WebUtility.HtmlEncode(subject)}
            </h2>
            <div style="color:#334155;font-size:15px;line-height:1.7;">
              {htmlContent}
            </div>
            <p style="margin:32px 0 0;color:#94a3b8;font-size:12px;
                      border-top:1px solid #f1f5f9;padding-top:16px;">
              Vous recevez cet email car vous êtes inscrit(e) sur APEX.<br/>
              <a href="mailto:{_smtp.SenderEmail}?subject=unsubscribe"
                 style="color:#94a3b8;">Se désabonner</a>
            </p>
            """;

        await SendAsync(
            to, name,
            subject: subject,
            body: WrapInBase(body),
            ct);
    }

    // ══════════════════════════════════════════════════════════
    //  Core Send
    // ══════════════════════════════════════════════════════════

    private async Task SendAsync(
        string to, string name,
        string subject, string body,
        CancellationToken ct = default)
    {
        var plainText = System.Text.RegularExpressions.Regex
            .Replace(body, "<[^>]+>", " ")
            .Replace("  ", " ")
            .Trim();

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_smtp.SenderName, _smtp.SenderEmail));
        msg.To.Add(new MailboxAddress(name, to));
        msg.Subject = subject;

        // Deliverability headers
        msg.Headers.Add("X-Mailer", "APEX-Mailer/2.0");
        msg.Headers.Add("X-Priority", "3");
        msg.Headers.Add("List-Unsubscribe", $"<mailto:{_smtp.SenderEmail}?subject=unsubscribe>");

        // Multipart/alternative: plain text + HTML (spam filters require plain-text fallback)
        var alternative = new Multipart("alternative");
        alternative.Add(new TextPart("plain") { Text = plainText });
        alternative.Add(new TextPart("html")  { Text = body });
        msg.Body = alternative;

        try
        {
            await _retryPolicy.ExecuteAsync(async () =>
            {
                using var smtp = new SmtpClient();
                smtp.Timeout = _smtp.TimeoutSeconds * 1000; // milliseconds
                var secureOpts = _smtp.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
                await smtp.ConnectAsync(_smtp.Host, _smtp.Port, secureOpts, ct);
                if (!string.IsNullOrEmpty(_smtp.User))
                    await smtp.AuthenticateAsync(_smtp.User, _smtp.Password, ct);
                await smtp.SendAsync(msg, ct);
                await smtp.DisconnectAsync(true, ct);
            });
            logger.LogInformation("[EMAIL] Sent to {To} | {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] Failed to send to {To} | {Subject}", to, subject);
            // Do not rethrow — email failures are logged, not surfaced to the caller.
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Base template wrapper (shared by all 3 branded emails)
    // ══════════════════════════════════════════════════════════

    private static string WrapInBase(string bodyContent) => $"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:16px;
                            overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                <!-- HEADER -->
                <tr><td style="background:linear-gradient(135deg,#fe9400,#ff8e80);
                               padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;
                             font-weight:900;letter-spacing:-1px;">APEX</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);
                            font-size:12px;text-transform:uppercase;
                            letter-spacing:2px;">by AVERS</p>
                </td></tr>
                <!-- BODY -->
                <tr><td style="padding:40px 48px;">
                  {bodyContent}
                </td></tr>
                <!-- FOOTER -->
                <tr><td style="padding:24px;text-align:center;
                               border-top:1px solid #f1f5f9;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;">
                    Propulsé par <strong style="color:#fe9400;">AVERS</strong> ·
                    <a href="mailto:contact@avers.fr"
                       style="color:#94a3b8;">contact@avers.fr</a>
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    // ══════════════════════════════════════════════════════════
    //  Legacy template — kept for alert digest
    // ══════════════════════════════════════════════════════════

    private static string BuildHtmlEmail(
        string title, string greeting, string message,
        string ctaLabel, string ctaUrl, string footer) => $"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <title>{title}</title>
        </head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;
                            border-radius:12px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="padding:28px 40px 20px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
                    <div style="font-size:26px;font-weight:800;color:#ff8e80;
                                letter-spacing:-0.03em;line-height:1;">APEX</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">by AVERS</div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;
                               color:#0f172a;letter-spacing:-0.01em;">{title}</h1>
                    <p style="margin:0 0 8px;font-size:15px;color:#334155;font-weight:500;">{greeting}</p>
                    <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.65;">
                      {message}
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:10px;background:#ff8e80;text-align:center;">
                          <a href="{ctaUrl}"
                             style="display:inline-block;padding:14px 32px;
                                    font-size:15px;font-weight:700;color:#ffffff;
                                    text-decoration:none;border-radius:10px;">
                            {ctaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
                      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                      <a href="{ctaUrl}" style="color:#ff8e80;word-break:break-all;">{ctaUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                      {footer}<br/>
                      © AVERS — APEX Platform. Vous recevez cet email car vous avez créé un compte APEX.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
}
