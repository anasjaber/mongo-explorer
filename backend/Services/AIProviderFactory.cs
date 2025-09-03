using Backend.Models;
using System;

namespace Backend.Services
{
    public class AIProviderFactory
    {
        public static IAIProviderService CreateProvider(AIProviderSettings settings)
        {
            if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
            {
                throw new ArgumentException("AI provider settings are not configured.");
            }
            
            switch (settings.Provider?.ToLower())
            {
                case "openai":
                    return new OpenAIProviderService(settings.ApiKey);
                    
                case "openrouter":
                    var apiUrl = !string.IsNullOrEmpty(settings.ApiUrl) 
                        ? settings.ApiUrl 
                        : "https://openrouter.ai/api/v1";
                    return new OpenRouterProviderService(settings.ApiKey, apiUrl);
                    
                default:
                    // Default to OpenAI for backward compatibility
                    return new OpenAIProviderService(settings.ApiKey);
            }
        }
    }
}