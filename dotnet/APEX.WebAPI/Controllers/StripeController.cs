using System.Security.Claims;
using APEX.Core.Entities;
using APEX.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace APEX.WebAPI.Controllers;

[ApiController]
[Route("api/stripe")]
[Authorize]
public class StripeController : ControllerBase
{
    private readonly ApexDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeController> _logger;

    public StripeController(ApexDbContext db, IConfiguration config, ILogger<StripeController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
    }

    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateSessionRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var domain = _config["Frontend:BaseUrl"] ?? "http://localhost:5191";
        
        // Configuration du prix en centimes
        long unitAmount = req.PlanId.ToLower() switch
        {
            "essentiel" => 299,
            "pro" => 599,
            "ultra" => 999,
            _ => 0
        };

        if (unitAmount == 0) return BadRequest(new { error = "Plan invalide" });

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = unitAmount,
                        Currency = "eur",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Plan APEX {char.ToUpper(req.PlanId[0]) + req.PlanId[1..]}",
                            Description = "Abonnement Premium APEX",
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = domain + "/payment-success?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = domain + "/payment-cancel",
            ClientReferenceId = userId.ToString(),
            Metadata = new Dictionary<string, string>
            {
                { "PlanId", req.PlanId },
                { "UserId", userId.ToString() }
            }
        };

        var service = new SessionService();
        Session session = await service.CreateAsync(options);

        return Ok(new { sessionId = session.Id, url = session.Url });
    }

    [HttpGet("success")]
    public async Task<IActionResult> PaymentSuccess([FromQuery] string session_id)
    {
        var service = new SessionService();
        Session session = await service.GetAsync(session_id);

        if (session.PaymentStatus == "paid")
        {
            var userIdStr = session.ClientReferenceId;
            var planId = session.Metadata["PlanId"];

            if (int.TryParse(userIdStr, out var userId))
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null)
                {
                    user.SubscriptionStatus = char.ToUpper(planId[0]) + planId[1..];
                    user.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                    
                    _logger.LogInformation("[STRIPE] User {Id} upgraded to {Plan}", userId, user.SubscriptionStatus);
                    
                    return Ok(new { success = true, plan = user.SubscriptionStatus });
                }
            }
        }

        return BadRequest(new { error = "Paiement non vérifié" });
    }
}

public record CreateSessionRequest(string PlanId);
