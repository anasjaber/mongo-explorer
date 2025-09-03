using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IAIProviderService
    {
        Task<string> GenerateQueryAsync(string prompt, string model);
        Task<bool> TestConnectionAsync();
        string ProviderName { get; }
    }
    
    public class AIQueryRequest
    {
        public string SystemPrompt { get; set; }
        public string UserPrompt { get; set; }
        public string Model { get; set; }
        public double Temperature { get; set; } = 0.7;
        public int MaxTokens { get; set; } = 800;
    }
    
    public class AIQueryResponse
    {
        public string Content { get; set; }
        public string Model { get; set; }
        public int TokensUsed { get; set; }
    }
}