using System.Net.Http.Headers;

var clientId = "PAR_apex_cb958a7173312da4c3265faeb308f9a6d6c4e3a7ead15cf87700ead6fe356323";
var clientSecret = "27496e2ed8fcef751ec4e042d468ce566d6817a0d81ebda17db006320c1100e0";
var url = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

using var httpClient = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.Post, url);
var content = new FormUrlEncodedContent(new[]
{
    new KeyValuePair<string, string>("grant_type", "client_credentials"),
    new KeyValuePair<string, string>("client_id", clientId),
    new KeyValuePair<string, string>("client_secret", clientSecret),
    new KeyValuePair<string, string>("scope", "api_offresdemploiv2 o2dsoffre")
});

request.Content = content;

Console.WriteLine("Sending request...");
var response = await httpClient.SendAsync(request);
var json = await response.Content.ReadAsStringAsync();

Console.WriteLine($"Status: {response.StatusCode}");
Console.WriteLine(json);
