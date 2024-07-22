using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using Newtonsoft.Json;
using OpenAI_API;
using OpenAI_API.Chat;
using OpenAI_API.Completions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ThirdParty.Json.LitJson;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AIQueryGeneratorController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AIQueryGeneratorController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<string>> GenerateQuery([FromBody] QueryGenerationRequest request)
    {
        var settings = await _context.OpenAISettings.FirstOrDefaultAsync();

        if (settings == null || string.IsNullOrEmpty(settings.ApiKey) || string.IsNullOrEmpty(settings.Model))
        {
            return StatusCode(500, "OpenAI API key is not configured.");
        }

        var openAi = new OpenAIAPI(settings.ApiKey);

        var connection = await _context.MongoConnections.FindAsync(request.ConnectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var (_, nonFormattedSchema) = await ReadSchema(connection, request.CollectionNames);

        var chatMessages = GenerateChatMessages(request, nonFormattedSchema);

        try
        {
            var chatRequest = new ChatRequest()
            {
                Model = settings.Model,
                Messages = chatMessages,
                Temperature = 0.7,
                MaxTokens = 800,
                TopP = 1,
                FrequencyPenalty = 0,
                PresencePenalty = 0
            };

            var chatResult = await openAi.Chat.CreateChatCompletionAsync(chatRequest);

            if (chatResult.Choices.Count > 0)
            {
                var generatedQuery = chatResult.Choices[0].Message.Content.Trim();
                generatedQuery = ExtractQueryFromCodeBlock(generatedQuery);
                return Ok(generatedQuery);
            }
            else
            {
                return StatusCode(500, "Failed to generate query.");
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error generating query: {ex.Message}");
        }
    }

    private List<ChatMessage> GenerateChatMessages(QueryGenerationRequest request, string schemaJson)
    {
        var messages = new List<ChatMessage>
        {
            new ChatMessage(ChatMessageRole.System, "You are an AI assistant that generates MongoDB queries. Your task is to create a MongoDB aggregation pipeline based on the given information and user's query."),
            new ChatMessage(ChatMessageRole.User, $@"
I need a MongoDB query for the following scenario:

Collections: {string.Join(", ", request.CollectionNames)}

Schemas:
{schemaJson}

User's Query: {request.NaturalLanguageQuery}

Please generate a MongoDB aggregation pipeline that answers the user's query. 
The query should be in the form of a JSON array of pipeline stages. 
Use the $lookup stage to join collections if necessary. 
Make sure to handle potential errors and edge cases.
Provide only the query without any additional explanation."),
        };

        return messages;
    }

    private string ExtractQueryFromCodeBlock(string content)
    {
        var startMarker = "```json";
        var endMarker = "```";
        var startIndex = content.IndexOf(startMarker);
        var endIndex = content.LastIndexOf(endMarker);

        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex)
        {
            startIndex += startMarker.Length;
            return content.Substring(startIndex, endIndex - startIndex).Trim();
        }

        return content;
    }

    private async Task<(string formattedSchema, string nonFormattedSchema)> ReadSchema(MongoConnection connection, List<string> includedCollections)
    {
        var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var client = new MongoClient(mongoClientSettings);
        var database = client.GetDatabase(connection.DatabaseName);
        var collections = database.ListCollectionNames().ToList();
        var schemaDictionary = new Dictionary<string, object>();
        foreach (var collectionName in collections)
        {
            if (includedCollections.Contains(collectionName) || includedCollections.Count == 0)
            {
                var collection = database.GetCollection<BsonDocument>(collectionName);
                var sampleDocument = await collection.Find(new BsonDocument())
                                               .Sort(Builders<BsonDocument>.Sort.Descending(d => d.ElementCount))
                                               .FirstOrDefaultAsync();
                if (sampleDocument != null)
                {
                    var schema = InferSchemaFromDocument(sampleDocument);
                    schemaDictionary.Add(collectionName, schema);
                }
            }
        }
        string formattedJsonSchema = JsonConvert.SerializeObject(schemaDictionary, Formatting.Indented);
        string nonFormattedJsonSchema = JsonConvert.SerializeObject(schemaDictionary);
        return (formattedJsonSchema, nonFormattedJsonSchema);
    }

    private object InferSchemaFromDocument(BsonDocument document)
    {
        var schema = new Dictionary<string, object>();
        foreach (var element in document.Elements)
        {
            switch (element.Value.BsonType)
            {
                case BsonType.Array:
                    schema[element.Name] = InferSchemaFromArray(element.Value.AsBsonArray);
                    break;
                case BsonType.Document:
                    schema[element.Name] = InferSchemaFromDocument(element.Value.AsBsonDocument);
                    break;
                default:
                    schema[element.Name] = element.Value.BsonType.ToString();
                    break;
            }
        }
        return schema;
    }

    private object InferSchemaFromArray(BsonArray array)
    {
        var arraySchema = new List<object>();
        if (array.Count > 0)
        {
            var firstElement = array[0];
            switch (firstElement.BsonType)
            {
                case BsonType.Document:
                    arraySchema.Add(InferSchemaFromDocument(firstElement.AsBsonDocument));
                    break;
                case BsonType.Array:
                    arraySchema.Add(InferSchemaFromArray(firstElement.AsBsonArray));
                    break;
                default:
                    arraySchema.Add(firstElement.BsonType.ToString());
                    break;
            }
        }
        return arraySchema;
    }
}

public class QueryGenerationRequest
{
    public int ConnectionId { get; set; }
    public List<string> CollectionNames { get; set; }
    public string NaturalLanguageQuery { get; set; }
}