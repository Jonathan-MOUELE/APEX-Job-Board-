namespace APEX.WebAPI.Services;

/// <summary>
/// Strongly-typed SMTP configuration (bound from appsettings "Smtp" section).
/// Inject via IOptions&lt;SmtpSettings&gt; — never use IConfiguration directly.
/// </summary>
public sealed class SmtpSettings
{
    public string Host           { get; init; } = "smtp.gmail.com";
    public int    Port           { get; init; } = 587;
    public bool   EnableSsl      { get; init; } = true;
    public string User           { get; init; } = "";
    public string Password       { get; init; } = "";
    public string SenderName     { get; init; } = "APEX by AVERS";
    public string SenderEmail    { get; init; } = "no-reply@avers.fr";
    public int    TimeoutSeconds { get; init; } = 10;
}
