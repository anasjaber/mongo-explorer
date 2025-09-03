using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

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
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        
        // Try new AI provider settings first
        var aiSettings = await _context.AIProviderSettings.FirstOrDefaultAsync(x => x.UserId == userId);
        
        // Fall back to legacy OpenAI settings if needed
        if (aiSettings == null)
        {
            var legacySettings = await _context.OpenAISettings.FirstOrDefaultAsync(x => x.UserId == userId);
            if (legacySettings != null && !string.IsNullOrEmpty(legacySettings.ApiKey))
            {
                aiSettings = new AIProviderSettings
                {
                    Provider = "OpenAI",
                    ApiKey = legacySettings.ApiKey,
                    Model = legacySettings.Model
                };
            }
        }
        
        if (aiSettings == null || string.IsNullOrEmpty(aiSettings.ApiKey) || string.IsNullOrEmpty(aiSettings.Model))
        {
            return StatusCode(500, "AI provider is not configured.");
        }

        var aiProvider = AIProviderFactory.CreateProvider(aiSettings);

        var connection = await _context.MongoConnections.FindAsync(request.ConnectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var (_, nonFormattedSchema) = await ReadSchema(connection, request.CollectionNames);

        var prompt = GeneratePrompt(request, nonFormattedSchema);

        try
        {
            Console.WriteLine($"Generating query with provider: {aiProvider.ProviderName}, Model: {aiSettings.Model}");
            var generatedQuery = await aiProvider.GenerateQueryAsync(prompt, aiSettings.Model);
            Console.WriteLine($"Raw generated query: {generatedQuery}");
            generatedQuery = ExtractQueryFromJavascriptBlock(generatedQuery);
            Console.WriteLine($"Extracted query: {generatedQuery}");
            
            if (string.IsNullOrWhiteSpace(generatedQuery))
            {
                Console.WriteLine("WARNING: Generated query is empty or null!");
                return StatusCode(500, "Failed to generate a valid query");
            }
            
            return Ok(new { query = generatedQuery });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error generating query: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Error generating query: {ex.Message}");
        }
    }

    private string GeneratePrompt(QueryGenerationRequest request, string schemaJson)
    {
        return $@"
I need a MongoDB query for the following scenario:

Collections: {string.Join(", ", request.CollectionNames)}

Schemas:
{schemaJson}

User's Query: {request.NaturalLanguageQuery}

Please generate a MongoDB query using aggregation pipeline that answers the user's query. 
The query should be in the form of mongo shell query with pipeline stages array. 
Use the $lookup stage to join collections if necessary. 
Make sure to handle potential errors and edge cases.

IMPORTANT: Return ONLY the MongoDB query code in a code block. Do not include any explanation or text outside the code block.
The query should be executable in MongoDB shell.

Example format:
```javascript
db.collection.aggregate([
  {{ $match: {{ field: value }} }},
  {{ $project: {{ field1: 1, field2: 1 }} }}
])
```";
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

    private string ExtractQueryFromJavascriptBlock(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return content;
            
        // Try javascript block first
        var jsStartMarker = "```javascript";
        var jsStartIndex = content.IndexOf(jsStartMarker);
        if (jsStartIndex != -1)
        {
            var endMarker = "```";
            var endIndex = content.IndexOf(endMarker, jsStartIndex + jsStartMarker.Length);
            if (endIndex != -1)
            {
                jsStartIndex += jsStartMarker.Length;
                return content.Substring(jsStartIndex, endIndex - jsStartIndex).Trim();
            }
        }
        
        // Try js block
        var jsShortMarker = "```js";
        jsStartIndex = content.IndexOf(jsShortMarker);
        if (jsStartIndex != -1)
        {
            var endMarker = "```";
            var endIndex = content.IndexOf(endMarker, jsStartIndex + jsShortMarker.Length);
            if (endIndex != -1)
            {
                jsStartIndex += jsShortMarker.Length;
                return content.Substring(jsStartIndex, endIndex - jsStartIndex).Trim();
            }
        }
        
        // Try json block
        var jsonStartMarker = "```json";
        var jsonStartIndex = content.IndexOf(jsonStartMarker);
        if (jsonStartIndex != -1)
        {
            var endMarker = "```";
            var endIndex = content.IndexOf(endMarker, jsonStartIndex + jsonStartMarker.Length);
            if (endIndex != -1)
            {
                jsonStartIndex += jsonStartMarker.Length;
                return content.Substring(jsonStartIndex, endIndex - jsonStartIndex).Trim();
            }
        }
        
        // Try any code block
        var anyStartMarker = "```";
        var anyStartIndex = content.IndexOf(anyStartMarker);
        if (anyStartIndex != -1)
        {
            var endIndex = content.IndexOf(anyStartMarker, anyStartIndex + anyStartMarker.Length);
            if (endIndex != -1)
            {
                // Check if there's a language identifier
                var newlineIndex = content.IndexOf('\n', anyStartIndex);
                if (newlineIndex != -1 && newlineIndex < endIndex)
                {
                    anyStartIndex = newlineIndex + 1;
                }
                else
                {
                    anyStartIndex += anyStartMarker.Length;
                }
                return content.Substring(anyStartIndex, endIndex - anyStartIndex).Trim();
            }
        }

        // If no code block found, return trimmed content
        return content.Trim();
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