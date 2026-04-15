using System.Net.Http.Json;
using System.Text.Json.Serialization;

var clientId = "PAR_apex_cb958a7173312da4c3265faeb308f9a6d6c4e3a7ead15cf87700ead6fe356323";
var clientSecret = "27496e2ed8fcef751ec4e042d468ce566d6817a0d81ebda17db006320c1100e0";
var tokenUrl = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire";
var scope = "api_offresdemploiv2 o2dsoffre";

Console.WriteLine($"Testing France Travail API Connectivity...");
Console.WriteLine($"Token URL: {tokenUrl}");

using var client = new HttpClient();
using var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl);
request.Content = new FormUrlEncodedContent(new[]
{
    new KeyValuePair<string, string>("grant_type", "client_credentials"),
    new KeyValuePair<string, string>("client_id", clientId),
    new KeyValuePair<string, string>("client_secret", clientSecret),
    new KeyValuePair<string, string>("scope", scope)
});

try 
{
    var response = await client.SendAsync(request);
    var body = await response.Content.ReadAsStringAsync();
    
    if (response.IsSuccessStatusCode)
    {
        Console.WriteLine("✅ Success! Token acquired.");
        Console.WriteLine(body);
    }
    else 
    {
        Console.WriteLine($"❌ Failed: HTTP {(int)response.StatusCode}");
        Console.WriteLine($"Body: {body}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Exception: {ex.Message}");
}
