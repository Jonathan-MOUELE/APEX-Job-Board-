// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — JobApplicationsController                      ║
// ║  Suivi candidatures : wishlist → applied → interview → offer ║
// ╚══════════════════════════════════════════════════════════════╝

using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using APEX.Core.Entities;
using APEX.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace APEX.WebAPI.Controllers;

[ApiController]
[Route("api/applications")]
[Authorize]
public class JobApplicationsController(ApexDbContext db) : ControllerBase
{
    private static readonly string[] ValidColumns =
        ["wishlist", "applied", "interview", "offer", "rejected"];

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub")
                  ?? throw new UnauthorizedAccessException());

    // GET /api/applications
    [HttpGet]
    public async Task<IActionResult> GetApplications(CancellationToken ct)
    {
        var uid = GetUserId();
        var apps = await db.JobApplications
            .Where(c => c.UserId == uid)
            .OrderBy(c => c.Column)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Company,
                c.Location,
                c.JobOfferId,
                c.Column,
                c.SortOrder,
                c.Notes,
                c.ApplyUrl,
                c.CreatedAt,
                c.UpdatedAt
            })
            .ToListAsync(ct);
        return Ok(apps);
    }

    // POST /api/applications
    [HttpPost]
    public async Task<IActionResult> CreateApplication(
        [FromBody] JobApplicationRequest req,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var uid = GetUserId();
        var count = await db.JobApplications.CountAsync(c => c.UserId == uid, ct);
        if (count >= 200)
            return BadRequest(new { error = "Maximum 200 candidatures suivies par compte." });

        var col = req.Column is not null && ValidColumns.Contains(req.Column)
            ? req.Column : "wishlist";

        var app = new JobApplication
        {
            UserId = uid,
            Title = (req.Title ?? "")[..Math.Min((req.Title ?? "").Length, 512)],
            Company = req.Company,
            Location = req.Location,
            JobOfferId = req.JobOfferId,
            Column = col,
            Notes = req.Notes,
            ApplyUrl = req.ApplyUrl
        };
        db.JobApplications.Add(app);
        await db.SaveChangesAsync(ct);
        return Ok(new
        {
            app.Id,
            app.Title,
            app.Company,
            app.Location,
            app.Column,
            app.JobOfferId,
            app.CreatedAt
        });
    }

    // PUT /api/applications/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateApplication(
        int id,
        [FromBody] JobApplicationRequest req,
        CancellationToken ct)
    {
        var uid = GetUserId();
        var app = await db.JobApplications
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid, ct);
        if (app is null) return NotFound();

        if (req.Title is not null) app.Title = req.Title[..Math.Min(req.Title.Length, 512)];
        if (req.Company is not null) app.Company = req.Company;
        if (req.Location is not null) app.Location = req.Location;
        if (req.Notes is not null) app.Notes = req.Notes;
        if (req.ApplyUrl is not null) app.ApplyUrl = req.ApplyUrl;
        if (req.SortOrder.HasValue) app.SortOrder = req.SortOrder.Value;
        if (req.Column is not null && ValidColumns.Contains(req.Column))
            app.Column = req.Column;

        app.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { app.Id, app.Column, app.SortOrder, app.UpdatedAt });
    }

    // DELETE /api/applications/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteApplication(int id, CancellationToken ct)
    {
        var uid = GetUserId();
        var app = await db.JobApplications
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid, ct);
        if (app is null) return NotFound();
        db.JobApplications.Remove(app);
        await db.SaveChangesAsync(ct);
        return Ok(new { deleted = true });
    }
}

public record JobApplicationRequest(
    [MaxLength(512)] string? Title,
    [MaxLength(256)] string? Company,
    [MaxLength(256)] string? Location,
    [MaxLength(64)] string? JobOfferId,
    [MaxLength(32)] string? Column,
    int? SortOrder,
    string? Notes,
    [MaxLength(1024)] string? ApplyUrl
);
