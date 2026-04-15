// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.WebAPI — AlertsController                              ║
// ║  Alertes de recherche — digest email quotidien/hebdo         ║
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
[Route("api/alerts")]
[Authorize]
public class AlertsController(ApexDbContext db) : ControllerBase
{
    private static readonly string[] ValidFrequencies = ["daily", "weekly"];

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub")
                  ?? throw new UnauthorizedAccessException());

    // GET /api/alerts
    [HttpGet]
    public async Task<IActionResult> GetAlerts(CancellationToken ct)
    {
        var uid = GetUserId();
        var alerts = await db.SearchAlerts
            .Where(a => a.UserId == uid)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new {
                a.Id, a.Keywords, a.Location, a.ContractType,
                a.Frequency, a.IsActive, a.LastSentAt, a.CreatedAt
            })
            .ToListAsync(ct);
        return Ok(alerts);
    }

    // POST /api/alerts
    [HttpPost]
    public async Task<IActionResult> CreateAlert(
        [FromBody] CreateAlertRequest req,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var uid = GetUserId();
        var activeCount = await db.SearchAlerts.CountAsync(a => a.UserId == uid && a.IsActive, ct);
        if (activeCount >= 10)
            return BadRequest(new { error = "Maximum 10 alertes actives par compte." });

        var freq = req.Frequency ?? "daily";
        if (!ValidFrequencies.Contains(freq))
            return BadRequest(new { error = "Fréquence invalide — utilisez \"daily\" ou \"weekly\"." });

        var alert = new SearchAlert
        {
            UserId       = uid,
            Keywords     = (req.Keywords ?? "développeur")[..Math.Min((req.Keywords ?? "développeur").Length, 256)],
            Location     = req.Location,
            ContractType = req.ContractType,
            Frequency    = freq,
            IsActive     = true
        };
        db.SearchAlerts.Add(alert);
        await db.SaveChangesAsync(ct);
        return Ok(alert);
    }

    // DELETE /api/alerts/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAlert(int id, CancellationToken ct)
    {
        var uid = GetUserId();
        var alert = await db.SearchAlerts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == uid, ct);
        if (alert is null) return NotFound();
        db.SearchAlerts.Remove(alert);
        await db.SaveChangesAsync(ct);
        return Ok(new { deleted = true });
    }

    // PUT /api/alerts/{id}/toggle
    [HttpPut("{id:int}/toggle")]
    public async Task<IActionResult> ToggleAlert(int id, CancellationToken ct)
    {
        var uid = GetUserId();
        var alert = await db.SearchAlerts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == uid, ct);
        if (alert is null) return NotFound();
        alert.IsActive = !alert.IsActive;
        await db.SaveChangesAsync(ct);
        return Ok(new { alert.Id, alert.IsActive });
    }
}

public record CreateAlertRequest(
    [MaxLength(256)] string?  Keywords,
    [MaxLength(256)] string?  Location,
    [MaxLength(64)]  string?  ContractType,
    [MaxLength(16)]  string?  Frequency
);
