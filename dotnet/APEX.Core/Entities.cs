// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Core — EF Core Entities V1 Production                  ║
// ║  User + RefreshToken + JobOffer + UserProfile                 ║
// ╚══════════════════════════════════════════════════════════════╝

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace APEX.Core.Entities;

/// <summary>
/// Utilisateur de la plateforme APEX.
/// </summary>
public class AppUser
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // ── Email Confirmation ─────────────────────────────────
    public bool IsEmailConfirmed { get; set; } = false;

    [MaxLength(128)]
    public string? EmailConfirmToken { get; set; }

    public DateTime? EmailConfirmTokenExpiry { get; set; }

    // ── Password Reset ─────────────────────────────────────
    [MaxLength(128)]
    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetExpiry { get; set; }

    // ── Role & Status ──────────────────────────────────────
    [Required, MaxLength(32)]
    public string Role { get; set; } = "user"; // "user" | "admin"

    public bool IsDeleted { get; set; } = false;

    // ── Lockout anti-brute force ───────────────────────────
    public int  FailedLoginCount { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }

    // ── Timestamps ─────────────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── CV Raw (pour rétrocompatibilité CvParserAgent) ─────
    [Column(TypeName = "TEXT")]
    public string? CvRawText { get; set; }

    // ── Navigation ─────────────────────────────────────────
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public UserProfile? Profile { get; set; }
    public ICollection<Bookmark> Bookmarks { get; set; } = [];
    public ICollection<SearchAlert> SearchAlerts { get; set; } = [];
    public ICollection<JobApplication> JobApplications { get; set; } = [];
}

/// <summary>
/// Refresh Token HttpOnly — rotation à chaque usage, theft detection.
/// </summary>
public class RefreshToken
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public AppUser User { get; set; } = null!;

    [Required, MaxLength(256)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiryDate { get; set; }

    public bool IsRevoked { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    [MaxLength(512)]
    public string? UserAgent { get; set; }
}

/// <summary>
/// Offre d'emploi stockée depuis France Travail.
/// </summary>
public class JobOfferEntity
{
    /// <summary>ID France Travail (string).</summary>
    [Key, MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(512)]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "TEXT")]
    public string Description { get; set; } = string.Empty;

    [MaxLength(256)]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? CompanyLogoUrl { get; set; }

    [MaxLength(256)]
    public string City { get; set; } = string.Empty;

    [MaxLength(16)]
    public string? PostalCode { get; set; }

    [MaxLength(64)]
    public string? Department { get; set; }

    public float? Latitude { get; set; }
    public float? Longitude { get; set; }

    [MaxLength(64)]
    public string ContractType { get; set; } = string.Empty;

    [MaxLength(128)]
    public string? ExperienceRequired { get; set; }

    [MaxLength(256)]
    public string? SalaryLabel { get; set; }

    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }

    /// <summary>List&lt;string&gt; sérialisée en JSON.</summary>
    [Column(TypeName = "TEXT")]
    public string TechSkillsJson { get; set; } = "[]";

    [Column(TypeName = "TEXT")]
    public string SoftSkillsJson { get; set; } = "[]";

    [Column(TypeName = "TEXT")]
    public string TrainingsJson { get; set; } = "[]";

    [MaxLength(1024)]
    public string? ApplyUrl { get; set; }

    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Profil candidat séparé de AppUser.
/// Contient CV, bio, compétences techniques et soft skills.
/// </summary>
public class UserProfile
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public AppUser User { get; set; } = null!;

    [Column(TypeName = "TEXT")]
    public string? Bio { get; set; }

    /// <summary>List&lt;string&gt; en JSON.</summary>
    [Column(TypeName = "TEXT")]
    public string TechStackJson { get; set; } = "[]";

    [Column(TypeName = "TEXT")]
    public string SoftSkillsJson { get; set; } = "[]";

    [MaxLength(256)]
    public string? CvFileName { get; set; }

    public DateTime? CvUploadedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Legacy compat (CvParserAgent outputs) ──────────────
    [Column(TypeName = "TEXT")]
    public string? HumanizedBio { get; set; }

    [Column(TypeName = "TEXT")]
    public string? ProfileJson { get; set; }
}

/// <summary>
/// Offre bookmarkée par un utilisateur — snapshot local pour persistance.
/// </summary>
public class Bookmark
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public AppUser User { get; set; } = null!;

    [Required, MaxLength(64)]  public string  JobOfferId   { get; set; } = "";
    [MaxLength(512)]           public string  JobTitle     { get; set; } = "";
    [MaxLength(256)]           public string  Company      { get; set; } = "";
    [MaxLength(256)]           public string  Location     { get; set; } = "";
    [MaxLength(64)]            public string  ContractType { get; set; } = "";
    [MaxLength(256)]           public string? SalaryLabel  { get; set; }
    [MaxLength(1024)]          public string? ApplyUrl     { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Alerte de recherche — digest e-mail quotidien ou hebdomadaire.
/// </summary>
public class SearchAlert
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public AppUser User { get; set; } = null!;

    [Required, MaxLength(256)] public string  Keywords     { get; set; } = "";
    [MaxLength(256)]           public string? Location     { get; set; }
    [MaxLength(64)]            public string? ContractType { get; set; }

    /// <summary>"daily" | "weekly"</summary>
    [MaxLength(16)]            public string  Frequency    { get; set; } = "daily";

    public bool     IsActive  { get; set; } = true;
    public DateTime? LastSentAt { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Fiche de suivi de candidature (anciennement Kanban).
/// Colonnes : wishlist → applied → interview → offer → rejected
/// </summary>
public class JobApplication
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public AppUser User { get; set; } = null!;

    [Required, MaxLength(512)] public string  Title      { get; set; } = "";
    [MaxLength(256)]           public string? Company    { get; set; }
    [MaxLength(256)]           public string? Location   { get; set; }
    [MaxLength(64)]            public string? JobOfferId { get; set; }

    /// <summary>"wishlist" | "applied" | "interview" | "offer" | "rejected"</summary>
    [MaxLength(32)]  public string  Column    { get; set; } = "wishlist";
    public int       SortOrder { get; set; } = 0;

    [Column(TypeName = "TEXT")] public string? Notes    { get; set; }
    [MaxLength(1024)]           public string? ApplyUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
