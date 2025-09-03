using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AIProviderSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly OpenRouterModelsService _openRouterModelsService;

        public AIProviderSettingsController(ApplicationDbContext context)
        {
            _context = context;
            _openRouterModelsService = new OpenRouterModelsService();
        }

        [HttpGet]
        public async Task<ActionResult<AIProviderSettings>> GetSettings()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var settings = await _context.AIProviderSettings.FirstOrDefaultAsync(x => x.UserId == userId);

            if (settings == null)
            {
                return Ok(new AIProviderSettings 
                { 
                    Provider = "OpenAI",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            return Ok(settings);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings(AIProviderSettings updatedSettings)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var settings = await _context.AIProviderSettings.FirstOrDefaultAsync(x => x.UserId == userId);
            
            if (settings == null)
            {
                settings = new AIProviderSettings
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AIProviderSettings.Add(settings);
            }

            settings.Provider = updatedSettings.Provider;
            settings.ApiKey = updatedSettings.ApiKey;
            settings.Model = updatedSettings.Model;
            settings.ApiUrl = updatedSettings.ApiUrl;
            settings.AdditionalSettings = updatedSettings.AdditionalSettings;
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        
        [HttpPost("test-connection")]
        public async Task<ActionResult<object>> TestConnection()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var settings = await _context.AIProviderSettings.FirstOrDefaultAsync(x => x.UserId == userId);
                
                if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
                {
                    return BadRequest(new { success = false, message = "AI provider settings not configured" });
                }
                
                var provider = AIProviderFactory.CreateProvider(settings);
                var isConnected = await provider.TestConnectionAsync();
                
                return Ok(new 
                { 
                    success = isConnected, 
                    message = isConnected ? $"Successfully connected to {provider.ProviderName}" : "Connection failed",
                    provider = provider.ProviderName
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
        
        [HttpGet("available-models")]
        public async Task<ActionResult<object>> GetAvailableModels([FromQuery] string provider)
        {
            switch (provider?.ToLower())
            {
                case "openai":
                    return Ok(new
                    {
                        models = new[]
                        {
                            new { value = "gpt-4-turbo-preview", label = "GPT-4 Turbo (Latest)", description = "Most capable, latest features", contextLength = 128000 },
                            new { value = "gpt-4", label = "GPT-4", description = "Most capable, higher cost", contextLength = 8192 },
                            new { value = "gpt-3.5-turbo", label = "GPT-3.5 Turbo", description = "Fast and cost-effective", contextLength = 16385 },
                            new { value = "gpt-3.5-turbo-16k", label = "GPT-3.5 Turbo 16K", description = "Extended context window", contextLength = 16385 }
                        }
                    });
                    
                case "openrouter":
                    try
                    {
                        Console.WriteLine("Fetching OpenRouter models...");
                        // Fetch models dynamically from OpenRouter API
                        var openRouterResponse = await _openRouterModelsService.GetAvailableModelsAsync();
                        
                        if (openRouterResponse != null && openRouterResponse.Data != null)
                        {
                            Console.WriteLine($"Received {openRouterResponse.Data.Count} models from OpenRouter API");
                            var recommendedModels = _openRouterModelsService.GetRecommendedModels(openRouterResponse);
                            Console.WriteLine($"Filtered to {recommendedModels.Count} recommended models");
                            
                            var models = recommendedModels
                                .Select(model => new
                                {
                                    value = model.Id,
                                    label = model.Name ?? model.Id,
                                    description = GetModelDescription(model.Id) ?? model.Description,
                                    contextLength = model.ContextLength ?? model.TopProvider?.ContextLength ?? 0,
                                    pricing = new
                                    {
                                        prompt = model.Pricing?.Prompt ?? "0",
                                        completion = model.Pricing?.Completion ?? "0"
                                    }
                                })
                                .OrderBy(m => GetModelSortOrder(m.value))
                                .ToList();
                            
                            if (models.Count > 0)
                            {
                                return Ok(new { models });
                            }
                        }
                        else
                        {
                            Console.WriteLine("OpenRouter API returned null or empty response");
                        }
                    }
                    catch (Exception ex)
                    {
                        // Fallback to static list if API call fails
                        Console.WriteLine($"Failed to fetch OpenRouter models: {ex.Message}");
                        Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    }
                    
                    // Fallback to static list
                    return Ok(new
                    {
                        models = OpenRouterModels.AvailableModels.Select(m => new 
                        {
                            value = m.Key,
                            label = m.Value,
                            description = GetModelDescription(m.Key),
                            contextLength = GetModelContextLength(m.Key)
                        })
                    });
                    
                default:
                    return Ok(new { models = Array.Empty<object>() });
            }
        }
        
        private bool IsRecommendedModel(string modelId)
        {
            // Filter for commonly used and reliable models
            var recommendedPrefixes = new[] 
            { 
                "openai/", "anthropic/", "google/", "meta-llama/", 
                "mistralai/", "cohere/", "deepseek/", "qwen/"
            };
            
            return recommendedPrefixes.Any(prefix => modelId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
        }
        
        private int GetModelSortOrder(string modelId)
        {
            // Prioritize models by provider and capability
            if (modelId.Contains("gpt-4")) return 1;
            if (modelId.Contains("claude-3-opus")) return 2;
            if (modelId.Contains("claude-3-sonnet")) return 3;
            if (modelId.Contains("gpt-3.5")) return 4;
            if (modelId.Contains("gemini")) return 5;
            if (modelId.Contains("llama")) return 6;
            if (modelId.Contains("mistral")) return 7;
            if (modelId.Contains("deepseek")) return 8;
            return 99;
        }
        
        private int GetModelContextLength(string modelKey)
        {
            // Default context lengths for known models
            if (modelKey.Contains("gpt-4-turbo")) return 128000;
            if (modelKey.Contains("gpt-4")) return 8192;
            if (modelKey.Contains("gpt-3.5-turbo-16k")) return 16385;
            if (modelKey.Contains("gpt-3.5")) return 4096;
            if (modelKey.Contains("claude-3")) return 200000;
            if (modelKey.Contains("gemini")) return 32768;
            if (modelKey.Contains("llama-3.1-70b")) return 131072;
            if (modelKey.Contains("mistral")) return 32768;
            return 4096; // Default
        }
        
        private string GetModelDescription(string modelKey)
        {
            if (modelKey.Contains("gpt-4")) return "Most capable";
            if (modelKey.Contains("gpt-3.5")) return "Fast and efficient";
            if (modelKey.Contains("claude-3-opus")) return "Very capable, creative";
            if (modelKey.Contains("claude-3-sonnet")) return "Balanced performance";
            if (modelKey.Contains("claude-3-haiku")) return "Fast and lightweight";
            if (modelKey.Contains("gemini")) return "Google's multimodal model";
            if (modelKey.Contains("llama")) return "Open source, powerful";
            if (modelKey.Contains("mistral")) return "European, efficient";
            if (modelKey.Contains("command")) return "Optimized for commands";
            return "AI model";
        }
    }
}