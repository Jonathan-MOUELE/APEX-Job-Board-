// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — FranceTravailOptions                   ║
// ╚══════════════════════════════════════════════════════════════╝

namespace APEX.Infrastructure;

public class FranceTravailOptions
{
    public const string SectionName = "FranceTravailApi";

    public string ClientId    { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string TokenUrl    { get; set; } = string.Empty;
    public string SearchUrl   { get; set; } = string.Empty;
    public string Scope       { get; set; } = "api_offresdemploiv2 o2dsoffre";
    public int    DefaultRadiusKm { get; set; } = 30;
    public int    CacheLastResultsCount { get; set; } = 50;
}
