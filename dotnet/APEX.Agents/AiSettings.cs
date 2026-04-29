// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Agents — AiSettings                                     ║
// ║  Configuration pour le provider IA (DeepSeek / Gemini).       ║
// ╚══════════════════════════════════════════════════════════════╝

namespace APEX.Agents;

/// <summary>Options de configuration pour le service IA.</summary>
public sealed class AiSettings
{
    public const string SectionName = "Ai";

    public string ApiKey { get; set; } = string.Empty;
    
    public string FlashModel { get; set; } = "deepseek-v4-pro";
    public string ProModel  { get; set; } = "deepseek-v4-pro";
    
    public int MaxOutputTokens { get; set; } = 4096;
    public int TimeoutSeconds { get; set; } = 60;

    public string Model => FlashModel;

    /// <summary>"gemini" or "deepseek" or "openrouter"</summary>
    public string Provider { get; set; } = "deepseek";

    // Common/OpenRouter-compatible
    public string BaseUrl  { get; set; } = "https://api.deepseek.com";
    public string SiteName { get; set; } = "APEX by AVERS";
    public string SiteUrl  { get; set; } = "https://apex-avers.fr";

    // Extended features
    public bool   Thinking        { get; set; } = false;
    public string ReasoningEffort { get; set; } = "high";
}
