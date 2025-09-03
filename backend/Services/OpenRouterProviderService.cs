using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace Backend.Services
{
    public class OpenRouterProviderService : IAIProviderService
    {
        private readonly string _apiKey;
        private readonly HttpClient _httpClient;
        private readonly string _apiUrl;
        
        public string ProviderName => "OpenRouter";
        
        public OpenRouterProviderService(string apiKey, string apiUrl = "https://openrouter.ai/api/v1")
        {
            _apiKey = apiKey;
            _apiUrl = apiUrl;
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "https://mongo-explorer.com");
            _httpClient.DefaultRequestHeaders.Add("X-Title", "Mongo Explorer");
        }
        
        public async Task<string> GenerateQueryAsync(string prompt, string model)
        {
            try
            {
                Console.WriteLine($"OpenRouter: Generating query with model: {model}");
                
                var requestBody = new
                {
                    model = model,
                    messages = new[]
                    {
                        new { 
                            role = "system", 
                            content = "You are an AI assistant that generates MongoDB queries. Your task is to create a MongoDB query using aggregation pipeline based on the given information and user's query."
                        },
                        new { role = "user", content = prompt }
                    },
                    temperature = 0.7,
                    max_tokens = 800,
                    top_p = 1,
                    frequency_penalty = 0,
                    presence_penalty = 0
                };
                
                var json = JsonConvert.SerializeObject(requestBody);
                Console.WriteLine($"OpenRouter Request: {json.Substring(0, Math.Min(json.Length, 500))}...");
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync($"{_apiUrl}/chat/completions", content);
                var responseContent = await response.Content.ReadAsStringAsync();
                
                Console.WriteLine($"OpenRouter Response Status: {response.StatusCode}");
                Console.WriteLine($"OpenRouter Response: {responseContent.Substring(0, Math.Min(responseContent.Length, 500))}...");
                
                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"OpenRouter API error: {response.StatusCode} - {responseContent}");
                }
                
                dynamic result = JsonConvert.DeserializeObject(responseContent);
                
                if (result?.choices != null && result.choices.Count > 0 && result.choices[0].message?.content != null)
                {
                    string generatedContent = result.choices[0].message.content.ToString().Trim();
                    Console.WriteLine($"OpenRouter Generated Content: {generatedContent.Substring(0, Math.Min(generatedContent.Length, 500))}...");
                    return generatedContent;
                }
                
                // Check if there's an error message in the response
                if (result?.error != null)
                {
                    throw new Exception($"OpenRouter API error: {result.error.message?.ToString() ?? result.error.ToString()}");
                }
                
                throw new Exception($"Failed to generate query from OpenRouter. Response: {responseContent}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"OpenRouter Exception: {ex.Message}");
                Console.WriteLine($"OpenRouter Stack: {ex.StackTrace}");
                throw;
            }
        }
        
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                var requestBody = new
                {
                    model = "openai/gpt-3.5-turbo",
                    messages = new[]
                    {
                        new { role = "user", content = "Say 'OK' if you can read this." }
                    },
                    max_tokens = 10
                };
                
                var json = JsonConvert.SerializeObject(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync($"{_apiUrl}/chat/completions", content);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }
    
    public class OpenRouterModels
    {
        public static readonly Dictionary<string, string> AvailableModels = new Dictionary<string, string>
        {
            { "openai/gpt-4-turbo-preview", "GPT-4 Turbo (OpenAI)" },
            { "openai/gpt-4", "GPT-4 (OpenAI)" },
            { "openai/gpt-3.5-turbo", "GPT-3.5 Turbo (OpenAI)" },
            { "anthropic/claude-3-opus", "Claude 3 Opus (Anthropic)" },
            { "anthropic/claude-3-sonnet", "Claude 3 Sonnet (Anthropic)" },
            { "anthropic/claude-3-haiku", "Claude 3 Haiku (Anthropic)" },
            { "google/gemini-pro", "Gemini Pro (Google)" },
            { "meta-llama/llama-3.1-70b-instruct", "Llama 3.1 70B (Meta)" },
            { "mistralai/mistral-large", "Mistral Large" },
            { "cohere/command-r-plus", "Command R+ (Cohere)" }
        };
    }
}