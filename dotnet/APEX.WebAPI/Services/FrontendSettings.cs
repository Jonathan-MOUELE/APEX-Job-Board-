namespace APEX.WebAPI.Services;

/// <summary>
/// Strongly-typed frontend URL configuration (bound from appsettings "Frontend" section).
/// Used to build links in transactional emails.
/// </summary>
public sealed class FrontendSettings
{
    /// <summary>Base URL of the web UI, e.g. https://apex.avers.fr</summary>
    public string BaseUrl { get; init; } = "http://localhost:5188";
}
