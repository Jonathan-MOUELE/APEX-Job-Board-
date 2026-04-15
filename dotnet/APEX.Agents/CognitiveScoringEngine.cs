using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace APEX.Agents
{
    public class CognitiveScoringEngine
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CognitiveScoringEngine> _logger;
        private readonly string _apiKey;

        public CognitiveScoringEngine(HttpClient httpClient, IConfiguration config, ILogger<CognitiveScoringEngine> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = config["Ai:OpenRouterKey"] ?? throw new ArgumentNullException("Ai:OpenRouterKey is missing in appsettings.json");
            
            _httpClient.BaseAddress = new Uri("https://openrouter.ai/api/v1/");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:5191");
            _httpClient.DefaultRequestHeaders.Add("X-Title", "APEX HR Scoring Engine");
        }

        public async Task<AnalysisReport> EvaluateProfileAsync(string cvText, string jobRequirements)
        {
            string systemPrompt = @"Tu es un expert RH IA. 
Évalue l'adéquation entre le profil et le poste.
Tu DOIS retourner un objet JSON strictement conforme au schéma spécifié. Zéro bloc Markdown, zéro explication hors JSON.";

            string userPrompt = $"EXIGENCES OFFRE:\n{jobRequirements}\n\nPROFIL CANDIDAT:\n{cvText}";

            // Payload construct according to OpenRouter Structured Outputs (DeepSeek V3 support)
            var payload = new
            {
                model = "deepseek/deepseek-chat", // Strict usage of DeepSeek V3
                temperature = 0.1,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                response_format = new
                {
                    type = "json_schema",
                    json_schema = new
                    {
                        name = "hr_evaluation_schema",
                        strict = true,
                        schema = new
                        {
                            type = "object",
                            properties = new
                            {
                                match_score = new { type = "integer", description = "Score de compatibilité sur 100" },
                                verdict = new { type = "string", @enum = new[] { "GO", "NO_GO", "REVIEW" }, description = "Recommandation" },
                                analytical_justification = new { type = "string", description = "Justification analytique brève" },
                                validated_skills = new { type = "array", items = new { type = "string" } },
                                missing_skills = new { type = "array", items = new { type = "string" } }
                            },
                            required = new[] { "match_score", "verdict", "analytical_justification", "validated_skills", "missing_skills" },
                            additionalProperties = false
                        }
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _logger.LogInformation("Sending evaluation request to OpenRouter/DeepSeek");

            var response = await _httpClient.PostAsync("chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("OpenRouter API error: {StatusCode} - {Error}", response.StatusCode, errorContent);
                throw new Exception($"OpenRouter API request failed with status code {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(responseContent);
            
            var messageContent = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrEmpty(messageContent))
            {
                throw new Exception("Received empty content from OpenRouter");
            }

            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                
                var report = JsonSerializer.Deserialize<AnalysisReport>(messageContent, options);
                
                if (report == null)
                {
                     throw new Exception("Failed to deserialize AnalysisReport from JSON.");
                }

                return report;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse JSON response. Raw string: {RawContent}", messageContent);
                throw new Exception("Failed to parse the evaluation JSON returned by the model.", ex);
            }
        }
    }

    public class AnalysisReport
    {
        [JsonPropertyName("match_score")]
        public int MatchScore { get; set; }

        [JsonPropertyName("verdict")]
        public string Verdict { get; set; } = string.Empty;

        [JsonPropertyName("analytical_justification")]
        public string AnalyticalJustification { get; set; } = string.Empty;

        [JsonPropertyName("validated_skills")]
        public string[] ValidatedSkills { get; set; } = Array.Empty<string>();

        [JsonPropertyName("missing_skills")]
        public string[] MissingSkills { get; set; } = Array.Empty<string>();
    }
}
