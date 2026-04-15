// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Core — Enums V1                                        ║
// ╚══════════════════════════════════════════════════════════════╝

namespace APEX.Core;

/// <summary>Verdict de matching offre vs profil.</summary>
public enum Verdict
{
    Go,
    NoGo
}

/// <summary>Rôle utilisateur (stocké en string dans la DB).</summary>
public enum UserRole
{
    Standard,
    Admin
}

/// <summary>Tier de correspondance IA.</summary>
public enum MatchTier
{
    PerfectFit,   // 85-100
    StrongMatch,  // 65-84
    PartialMatch, // 45-64
    NoGo          // 0-44
}
