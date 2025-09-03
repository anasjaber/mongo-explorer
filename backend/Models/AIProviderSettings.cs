using System;

namespace Backend.Models
{
    public class AIProviderSettings
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Provider { get; set; } // "OpenAI", "OpenRouter", etc.
        public string ApiKey { get; set; }
        public string Model { get; set; }
        public string? ApiUrl { get; set; } // Optional custom API URL for providers like OpenRouter
        public string? AdditionalSettings { get; set; } // JSON string for provider-specific settings
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
    public enum AIProvider
    {
        OpenAI,
        OpenRouter,
        Anthropic,
        Custom
    }
}