using System.Net.Http.Headers;

// 1. INITIALISATION DU BUILDER (La ligne qui te manquait)
var builder = WebApplication.CreateBuilder(args);

// 2. CONFIGURATION DES SERVICES (Autoriser les requêtes externes et les contrôleurs)
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// 3. CONSTRUCTION DE L'APPLICATION
var app = builder.Build();

// 4. MIDDLEWARES (L'ordre est vital)
app.UseDefaultFiles(); // Cherche index.html par défaut
app.UseStaticFiles();  // Autorise la lecture du dossier wwwroot (Fix de l'erreur MIME)

app.UseRouting();
app.UseCors();
app.MapControllers(); // Connecte tes routes API (ex: /api/jobs/search)

// --------------------------------------------------------
// 5. TON TEST FRANCE TRAVAIL (Au démarrage du serveur)
// --------------------------------------------------------
var clientId = "PAR_apex_cb958a7173312da4c3265faeb308f9a6d6c4e3a7ead15cf87700ead6fe356323";
var clientSecret = "27496e2ed8fcef751ec4e042d468ce566d6817a0d81ebda17db006320c1100e0";
var url = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

using var httpClient = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.Post, url);
request.Content = new FormUrlEncodedContent(new[]
{
    new KeyValuePair<string, string>("grant_type", "client_credentials"),
    new KeyValuePair<string, string>("client_id", clientId),
    new KeyValuePair<string, string>("client_secret", clientSecret),
    new KeyValuePair<string, string>("scope", "api_offresdemploiv2 o2dsoffre")
});

Console.WriteLine("Récupération du token France Travail...");
var response = await httpClient.SendAsync(request);
var json = await response.Content.ReadAsStringAsync();
Console.WriteLine($"Status FT: {response.StatusCode}");
// --------------------------------------------------------

// 6. DÉMARRAGE DU SERVEUR
app.Run();