using OpenAI_API;
using OpenAI_API.Chat;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class OpenAIProviderService : IAIProviderService
    {
        private readonly string _apiKey;
        private readonly OpenAIAPI _openAi;
        
        public string ProviderName => "OpenAI";
        
        public OpenAIProviderService(string apiKey)
        {
            _apiKey = apiKey;
            _openAi = new OpenAIAPI(apiKey);
        }
        
        public async Task<string> GenerateQueryAsync(string prompt, string model)
        {
            var chatMessages = new List<ChatMessage>
            {
                new ChatMessage(ChatMessageRole.System, "You are an AI assistant that generates MongoDB queries. Your task is to create a MongoDB query using aggregation pipeline based on the given information and user's query."),
                new ChatMessage(ChatMessageRole.User, prompt)
            };
            
            var chatRequest = new ChatRequest()
            {
                Model = model,
                Messages = chatMessages,
                Temperature = 0.7,
                MaxTokens = 800,
                TopP = 1,
                FrequencyPenalty = 0,
                PresencePenalty = 0
            };
            
            var chatResult = await _openAi.Chat.CreateChatCompletionAsync(chatRequest);
            
            if (chatResult.Choices.Count > 0)
            {
                return chatResult.Choices[0].Message.Content.Trim();
            }
            
            throw new Exception("Failed to generate query from OpenAI.");
        }
        
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                var chatMessages = new List<ChatMessage>
                {
                    new ChatMessage(ChatMessageRole.User, "Say 'OK' if you can read this.")
                };
                
                var chatRequest = new ChatRequest()
                {
                    Model = "gpt-3.5-turbo",
                    Messages = chatMessages,
                    MaxTokens = 10
                };
                
                var result = await _openAi.Chat.CreateChatCompletionAsync(chatRequest);
                return result.Choices.Count > 0;
            }
            catch
            {
                return false;
            }
        }
    }
}