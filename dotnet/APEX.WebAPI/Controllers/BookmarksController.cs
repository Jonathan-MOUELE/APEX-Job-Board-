// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — BookmarksController                           ║
// ║  Favoris utilisateur (offres bookmarkées)                    ║
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
[Route("api/bookmarks")]
[Authorize]
public class BookmarksController(ApexDbContext db) : ControllerBase
{
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub")
                  ?? throw new UnauthorizedAccessException());

    // GET /api/bookmarks
    [HttpGet]
    public async Task<IActionResult> GetBookmarks(CancellationToken ct)
    {
        var uid = GetUserId();
        var bks = await db.Bookmarks
            .Where(b => b.UserId == uid)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new {
                b.Id, b.JobOfferId, b.JobTitle, b.Company,
                b.Location, b.ContractType, b.SalaryLabel, b.ApplyUrl, b.CreatedAt
            })
            .ToListAsync(ct);
        return Ok(bks);
    }

    // GET /api/bookmarks/ids  — lightweight: just the bookmarked job IDs for the current user
    [HttpGet("ids")]
    public async Task<IActionResult> GetIds(CancellationToken ct)
    {
        var uid = GetUserId();
        var ids = await db.Bookmarks
            .Where(b => b.UserId == uid)
            .Select(b => b.JobOfferId)
            .ToListAsync(ct);
        return Ok(ids);
    }

    // POST /api/bookmarks
    [HttpPost]
    public async Task<IActionResult> AddBookmark(
        [FromBody] AddBookmarkRequest req,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var uid = GetUserId();

        if (await db.Bookmarks.AnyAsync(b => b.UserId == uid && b.JobOfferId == req.JobOfferId, ct))
            return Conflict(new { error = "Déjà en favoris." });

        static string Trim(string? s, int max) =>
            (s ?? "").Length > max ? (s ?? "")[..max] : (s ?? "");

        var bk = new Bookmark
        {
            UserId       = uid,
            JobOfferId   = Trim(req.JobOfferId,  64),
            JobTitle     = Trim(req.JobTitle,   512),
            Company      = Trim(req.Company,    256),
            Location     = Trim(req.Location,   256),
            ContractType = Trim(req.ContractType, 64),
            SalaryLabel  = req.SalaryLabel,
            ApplyUrl     = req.ApplyUrl
        };
        db.Bookmarks.Add(bk);
        await db.SaveChangesAsync(ct);
        return Ok(new { bk.Id, bookmarked = true });
    }

    // DELETE /api/bookmarks/{jobOfferId}
    [HttpDelete("{jobOfferId}")]
    public async Task<IActionResult> RemoveBookmark(string jobOfferId, CancellationToken ct)
    {
        var uid = GetUserId();
        var bk = await db.Bookmarks.FirstOrDefaultAsync(
            b => b.UserId == uid && b.JobOfferId == jobOfferId, ct);
        if (bk is null) return NotFound();
        db.Bookmarks.Remove(bk);
        await db.SaveChangesAsync(ct);
        return Ok(new { bookmarked = false });
    }
}

public record AddBookmarkRequest(
    [Required, MaxLength(64)]  string  JobOfferId,
    [MaxLength(512)]           string? JobTitle,
    [MaxLength(256)]           string? Company,
    [MaxLength(256)]           string? Location,
    [MaxLength(64)]            string? ContractType,
    [MaxLength(256)]           string? SalaryLabel,
    [MaxLength(1024)]          string? ApplyUrl
);
