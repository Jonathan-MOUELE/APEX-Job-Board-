using System.Net.Http.Headers;

var clientId = "PAR_apex_cb958a7173312da4c3265faeb308f9a6d6c4e3a7ead15cf87700ead6fe356323";
var clientSecret = "27496e2ed8fcef751ec4e042d468ce566d6817a0d81ebda17db006320c1100e0";
var tokenUrl = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire";
var searchUrl = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
var scope = "api_offresdemploiv2 o2dsoffre";

using var client = new HttpClient();

Console.WriteLine("1. Acquiring Token...");
var tokenRequest = new HttpRequestMessage(HttpMethod.Post, tokenUrl);
tokenRequest.Content = new FormUrlEncodedContent(new[]
{
    new KeyValuePair<string, string>("grant_type", "client_credentials"),
    new KeyValuePair<string, string>("client_id", clientId),
    new KeyValuePair<string, string>("client_secret", clientSecret),
    new KeyValuePair<string, string>("scope", scope)
});

var tokenResponse = await client.SendAsync(tokenRequest);
var tokenBody = await tokenResponse.Content.ReadAsStringAsync();
if (!tokenResponse.IsSuccessStatusCode) {
    Console.WriteLine($"Token Error: {tokenBody}");
    return;
}

var token = System.Text.Json.JsonDocument.Parse(tokenBody).RootElement.GetProperty("access_token").GetString();
Console.WriteLine("✅ Token acquired.");

Console.WriteLine("2. Testing Search API...");
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
var url = $"{searchUrl}?motsCles=developpeur&range=0-9";

var searchResponse = await client.GetAsync(url);
var searchBody = await searchResponse.Content.ReadAsStringAsync();

if (searchResponse.IsSuccessStatusCode) {
    Console.WriteLine("✅ Search Success!");
    Console.WriteLine($"Found: {searchBody.Substring(0, Math.Min(500, searchBody.Length))}...");
} else {
    Console.WriteLine($"❌ Search Failed: HTTP {(int)searchResponse.StatusCode}");
    Console.WriteLine($"Body: {searchBody}");
}
