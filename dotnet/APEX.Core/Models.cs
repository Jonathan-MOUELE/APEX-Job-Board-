// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Core — Domain Records / DTOs V1 Production             ║
// ╚══════════════════════════════════════════════════════════════╝

namespace APEX.Core;

/// <summary>
/// Offre d'emploi récupérée depuis France Travail — DTO immuable.
/// </summary>
public record JobOffer(
    string Id,
    string Title,
    string Company,
    string? CompanyLogoUrl,
    string Location,
    string? PostalCode,
    string ContractType,
    string? ExperienceRequired,
    string Description,
    List<string> RequiredTechs,
    List<string> NiceToHaveTechs,
    List<string> RequiredSoftSkills,
    List<string> Trainings,
    string? SalaryLabel,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string? OriginUrl,
    DateTime DateCreated,
    string Source = "FR"  // "FR" = France Travail, "EU/Remote" = Arbeitnow
);

/// <summary>
/// Profil candidat IA (DTO immuable) — distinct de l'entité EF Entities.UserProfile.
/// Utilisé par IAgentAnalyst et CvParserAgent.
/// </summary>
public record CandidateProfile(
    string Name,
    string Title,
    Dictionary<string, TechDetail> Technologies,
    List<string> SoftSkills,
    string Formation,
    List<string> Objectifs
);

/// <summary>Détail d'une technologie maîtrisée.</summary>
public record TechDetail(
    string Level,
    int Years,
    List<string> Tags
);

/// <summary>Décomposition du score technique.</summary>
public record TechBreakdown(
    List<string> Matched,
    List<string> Missing,
    List<string> Bonus,
    double Score
);

/// <summary>
/// Résultat complet d'analyse offre vs profil — V1 enrichi.
/// </summary>
public record MatchResult(
    JobOffer Job,
    string ProfileName,
    double OverallScore,
    TechBreakdown TechBreakdown,
    double SoftSkillScore,
    Verdict Verdict,
    string MatchTier,
    string TierEmoji,
    string Justification,
    string JustificationSource,
    List<string> MatchedSofts,
    List<string> MissingSofts,
    string? SalaryFlag,
    string? ApplyUrl,
    DateTime AnalyzedAt
);
