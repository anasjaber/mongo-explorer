using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Backend.Services
{
    public class OpenRouterModelsService
    {
        private readonly HttpClient _httpClient;
        private readonly string _modelsApiUrl = "https://openrouter.ai/api/v1/models";
        
        public OpenRouterModelsService()
        {
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "MongoExplorer/1.0");
        }
        
        public async Task<OpenRouterModelsResponse> GetAvailableModelsAsync()
        {
            try
            {
                Console.WriteLine($"Requesting models from: {_modelsApiUrl}");
                var response = await _httpClient.GetAsync(_modelsApiUrl);
                Console.WriteLine($"OpenRouter API response status: {response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Response length: {jsonString.Length} characters");
                    
                    var result = JsonConvert.DeserializeObject<OpenRouterModelsResponse>(jsonString);
                    Console.WriteLine($"Deserialized {result?.Data?.Count ?? 0} models");
                    return result;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"OpenRouter API error: {response.StatusCode} - {errorContent}");
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching OpenRouter models: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return null;
            }
        }
        
        public List<OpenRouterModelInfo> GetRecommendedModels(OpenRouterModelsResponse response)
        {
            var recommendedModels = new List<OpenRouterModelInfo>();
            
            if (response?.Data == null) return recommendedModels;
            
            var recommendedPrefixes = new[] 
            { 
                "openai/", "anthropic/", "google/", "meta-llama/", 
                "mistralai/", "cohere/", "deepseek/", "qwen/"
            };
            
            foreach (var model in response.Data)
            {
                if (model.Id != null && 
                    Array.Exists(recommendedPrefixes, prefix => 
                        model.Id.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
                {
                    recommendedModels.Add(model);
                }
            }
            
            return recommendedModels;
        }
    }
    
    public class OpenRouterModelsResponse
    {
        [JsonProperty("data")]
        public List<OpenRouterModelInfo> Data { get; set; }
    }
    
    public class OpenRouterModelInfo
    {
        [JsonProperty("id")]
        public string Id { get; set; }
        
        [JsonProperty("name")]
        public string Name { get; set; }
        
        [JsonProperty("description")]
        public string Description { get; set; }
        
        [JsonProperty("context_length")]
        public int? ContextLength { get; set; }
        
        [JsonProperty("pricing")]
        public OpenRouterPricing Pricing { get; set; }
        
        [JsonProperty("architecture")]
        public OpenRouterArchitecture Architecture { get; set; }
        
        [JsonProperty("top_provider")]
        public OpenRouterProvider TopProvider { get; set; }
    }
    
    public class OpenRouterPricing
    {
        [JsonProperty("prompt")]
        public string Prompt { get; set; }
        
        [JsonProperty("completion")]
        public string Completion { get; set; }
        
        [JsonProperty("image")]
        public string Image { get; set; }
        
        [JsonProperty("request")]
        public string Request { get; set; }
    }
    
    public class OpenRouterArchitecture
    {
        [JsonProperty("modality")]
        public string Modality { get; set; }
        
        [JsonProperty("tokenizer")]
        public string Tokenizer { get; set; }
        
        [JsonProperty("instruct_type")]
        public string InstructType { get; set; }
    }
    
    public class OpenRouterProvider
    {
        [JsonProperty("context_length")]
        public int? ContextLength { get; set; }
        
        [JsonProperty("max_completion_tokens")]
        public int? MaxCompletionTokens { get; set; }
        
        [JsonProperty("is_moderated")]
        public bool? IsModerated { get; set; }
    }
}