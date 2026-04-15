// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Infrastructure — ApexDbContext V1 Production           ║
// ║  SQLite via EF Core — User, RefreshToken, JobOffer, Profile  ║
// ╚══════════════════════════════════════════════════════════════╝

using Microsoft.EntityFrameworkCore;
using APEX.Core.Entities;

namespace APEX.Infrastructure.Data;

/// <summary>
/// DbContext principal APEX — V1 Production schema.
/// </summary>
public class ApexDbContext(DbContextOptions<ApexDbContext> options) : DbContext(options)
{
    public DbSet<AppUser>       Users         => Set<AppUser>();
    public DbSet<RefreshToken>  RefreshTokens => Set<RefreshToken>();
    public DbSet<JobOfferEntity> JobOffers    => Set<JobOfferEntity>();
    public DbSet<UserProfile>   UserProfiles  => Set<UserProfile>();
    public DbSet<Bookmark>      Bookmarks     => Set<Bookmark>();
    public DbSet<SearchAlert>   SearchAlerts  => Set<SearchAlert>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── AppUser ────────────────────────────────────────────
        modelBuilder.Entity<AppUser>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.IsDeleted).HasDefaultValue(false);
            e.Property(u => u.IsEmailConfirmed).HasDefaultValue(false);
            e.Property(u => u.Role).HasDefaultValue("user");
        });

        // ─── RefreshToken ────────────────────────────────────────
        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(rt => rt.Token).IsUnique();
            e.HasIndex(rt => new { rt.UserId, rt.ExpiryDate });

            e.HasOne(rt => rt.User)
             .WithMany(u => u.RefreshTokens)
             .HasForeignKey(rt => rt.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── JobOfferEntity ─────────────────────────────────────
        modelBuilder.Entity<JobOfferEntity>(e =>
        {
            e.HasIndex(j => j.FetchedAt);
            e.HasIndex(j => j.Title);
            e.HasIndex(j => j.IsActive);
            e.Property(j => j.IsActive).HasDefaultValue(true);
            e.Property(j => j.SalaryMin).HasColumnType("decimal(18,2)");
            e.Property(j => j.SalaryMax).HasColumnType("decimal(18,2)");
        });

        // ─── UserProfile ─────────────────────────────────────────
        modelBuilder.Entity<UserProfile>(e =>
        {
            e.HasIndex(p => p.UserId).IsUnique();

            e.HasOne(p => p.User)
             .WithOne(u => u.Profile)
             .HasForeignKey<UserProfile>(p => p.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Bookmark ────────────────────────────────────────────
        modelBuilder.Entity<Bookmark>(e =>
        {
            e.HasIndex(b => new { b.UserId, b.JobOfferId }).IsUnique();
            e.HasOne(b => b.User)
             .WithMany(u => u.Bookmarks)
             .HasForeignKey(b => b.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── SearchAlert ─────────────────────────────────────────
        modelBuilder.Entity<SearchAlert>(e =>
        {
            e.HasIndex(a => new { a.UserId, a.IsActive });
            e.HasOne(a => a.User)
             .WithMany(u => u.SearchAlerts)
             .HasForeignKey(a => a.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── JobApplication (Suivi) ──────────────────────────
        modelBuilder.Entity<JobApplication>(e =>
        {
            e.HasIndex(c => new { c.UserId, c.Column });
            e.HasOne(c => c.User)
             .WithMany(u => u.JobApplications)
             .HasForeignKey(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
