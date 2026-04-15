// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Agents — AiSettings                                     ║
// ║  Configuration pour le provider IA (Gemini / Claude).         ║
// ╚══════════════════════════════════════════════════════════════╝

namespace APEX.Agents;

/// <summary>Options de configuration pour le service IA.</summary>
public sealed class AiSettings
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    
    public string FlashModel { get; set; } = "gemini-2.0-flash";
    public string ProModel  { get; set; } = "gemini-2.0-flash";
    
    public int MaxOutputTokens { get; set; } = 1024;
    public int TimeoutSeconds { get; set; } = 30;

    public string Model => FlashModel;

    /// <summary>"gemini" (default) or "openrouter"</summary>
    public string Provider { get; set; } = "gemini";

    // OpenRouter-specific
    public string BaseUrl  { get; set; } = string.Empty;
    public string SiteName { get; set; } = "APEX by AVERS";
    public string SiteUrl  { get; set; } = "https://apex-avers.fr";
}
