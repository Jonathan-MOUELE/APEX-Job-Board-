// ╔══════════════════════════════════════════════════════════════╗
// ║  APEX.Agents — CvParserAgent                                 ║
// ║  Lit le texte brut d'un CV et demande au LLM d'extraire le   ║
// ║  profil et de générer une bio humanisée.                     ║
// ╚══════════════════════════════════════════════════════════════╝

using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using System.Net.Http;
using System.Text;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;
using APEX.Core;

namespace APEX.Agents;

// Request DTOs pour le parsing
public record CvParseResult(
    string RawText, 
    string HumanizedBio, 
    string ProfileJson,
    CandidateProfile Profile
);

// Structuration de la sortie attendue du LLM
public class LlmCvExtraction
{
    [JsonPropertyName("humanizedBio")]
    public string HumanizedBio { get; set; } = string.Empty;

    [JsonPropertyName("technologies")]
    public Dictionary<string, TechDetail> Technologies { get; set; } = new();

    [JsonPropertyName("softSkills")]
    public List<string> SoftSkills { get; set; } = new();

    [JsonPropertyName("formation")]
    public string Formation { get; set; } = string.Empty;

    [JsonPropertyName("objectifs")]
    public List<string> Objectifs { get; set; } = new();
}

public interface ICvParserAgent
{
    Task<CvParseResult> ParsePdfAsync(Stream pdfStream, CancellationToken ct = default);
}

public class CvParserAgent(
    IOptions<AiSettings> aiSettings,
    ILogger<CvParserAgent> logger) : ICvParserAgent
{
    private readonly AiSettings _opts = aiSettings.Value;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<CvParseResult> ParsePdfAsync(Stream pdfStream, CancellationToken ct = default)
    {
        // 1. Extraire le texte du PDF
        string rawText = ExtractTextFromPdf(pdfStream);
        
        if (string.IsNullOrWhiteSpace(rawText))
        {
            logger.LogWarning("[CV PARSER] Impossible d'extraire du texte du PDF.");
            throw new Exception("Le PDF semble vide ou illisible.");
        }

        logger.LogInformation("[CV PARSER] Texte extrait ({Length} chars). Lancement du LLM...", rawText.Length);

        // 2. Demander au LLM d'analyser
        var llmResult = await CallLlmToParseCvAsync(rawText, ct);

        // 3. Préparer le Json final du UserProfile (comme l'ancien GetDemoProfile)
        var userProfile = new CandidateProfile(
            Name: "Utilisateur",
            Title: "Profil extrait du CV",
            Technologies: llmResult.Technologies,
            SoftSkills: llmResult.SoftSkills,
            Formation: llmResult.Formation,
            Objectifs: llmResult.Objectifs
        );

        var profileJson = JsonSerializer.Serialize(userProfile, JsonOpts);

        return new CvParseResult(
            RawText: rawText,
            HumanizedBio: llmResult.HumanizedBio,
            ProfileJson: profileJson,
            Profile: userProfile
        );
    }

    private string ExtractTextFromPdf(Stream pdfStream)
    {
        try
        {
            using var pdfDoc = PdfDocument.Open(pdfStream);
            var text = new System.Text.StringBuilder();

            foreach (var page in pdfDoc.GetPages())
            {
                text.AppendLine(page.Text);
            }

            return text.ToString();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[CV PARSER] Erreur lors de la lecture PdfPig.");
            throw new Exception("Erreur lors de la lecture du fichier PDF.", ex);
        }
    }

    private async Task<LlmCvExtraction> CallLlmToParseCvAsync(string cvText, CancellationToken ct)
    {
        var modelId = _opts.ProModel ?? "gemini-3.1-pro-preview";
        var apiKey = _opts.ApiKey ?? throw new InvalidOperationException("API Key manquante.");

        var systemPrompt = @"Tu es un expert en recrutement IT. 
On te fournit le contenu brut d'un CV.
Ton but est d'extraire toutes les informations techniques et les compétences comportementales, puis de rédiger une bio humaine.

IMPORTANT - RÈGLES DE REDACTION DE LA BIO (humanizedBio) :
Tu dois rédiger une ou deux phrases maximum, à la première personne du singulier (""Je""), comme si tu étais le développeur qui se présente à un autre développeur.
Pas de buzzwords marketing insupportables. Le ton doit être professionnel mais naturel, décontracté et technique.
Jamais de tournures IA comme 'il est évident', 'en conclusion', 'je me définis comme'. Écris comme un humain qui parle à un collègue.
Exemple: ""Je suis un dev C# et Python, j'ai l'habitude de bosser sur des backends complexes avec .NET. Je cherche une alternance pour consolider mon exp.""

Tu dois renvoyer STRICTEMENT un objet JSON valide suivant la structure requise, sans markdown.
Structure attendue :
{
  ""humanizedBio"": ""string"",
  ""technologies"": { ""NomTechno"": { ""niveau"": ""avancé/intermédiaire/débutant"", ""anneesExperience"": 1, ""contextes"": [""mots""] } },
  ""softSkills"": [""string""],
  ""formation"": ""string"",
  ""objectifs"": [""string""]
}";

        var requestBody = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { parts = new[] { new { text = $"Voici le texte brut du CV :\n\n{cvText}" } } }
            },
            generationConfig = new
            {
                temperature = 0.2,
                response_mime_type = "application/json"
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent?key={apiKey}";
        
        using var httpClient = new HttpClient();
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try
        {
            var response = await httpClient.PostAsync(url, content, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            var geminiResponse = JsonDocument.Parse(responseJson);
            var textResult = geminiResponse.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();
                
            var jsonText = textResult?.Trim();
            
            // Nettoyage markdown éventuel
            if (jsonText != null && jsonText.StartsWith("```json"))
            {
                jsonText = jsonText.Substring(7);
                if (jsonText.EndsWith("```")) jsonText = jsonText.Substring(0, jsonText.Length - 3);
            }

            var extraction = JsonSerializer.Deserialize<LlmCvExtraction>(jsonText ?? "{}", JsonOpts);
            return extraction ?? new LlmCvExtraction();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[CV PARSER] Erreur LLM lors de l'appel à l'API Gemini ou du parsing JSON.");
            throw new Exception("L'analyse IA de votre CV a échoué. Veuillez réessayer.", ex);
        }
    }
}
