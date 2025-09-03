using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using OpenAI_API;
using MongoDB.Bson;
using MongoDB.Driver;
using OpenAI_API.Completions;
using Microsoft.Extensions.Configuration;
using OpenAI_API.Chat;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using Azure.Core;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.Services;
using Backend.Models;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QueryProfilerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly QueryProfilerService _profilerService;

    public QueryProfilerController(ApplicationDbContext context, QueryProfilerService profilerService)
    {
        _context = context;
        _profilerService = profilerService;
    }

    [HttpGet("profiled-queries/{connectionId}")]
    public async Task<ActionResult<IEnumerable<ProfiledQuery>>> GetProfiledQueries(int connectionId)
    {
        var connection = await _context.MongoConnections.FindAsync(connectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(connection.DatabaseName);
        var profileCollection = database.GetCollection<BsonDocument>("system.profile");

        var filter = Builders<BsonDocument>.Filter.Empty;
        var sort = Builders<BsonDocument>.Sort.Descending("ts");

        var profiledQueries = await profileCollection.Find(filter)
            .Sort(sort)
            .Limit(100)
            .ToListAsync();

        var result = profiledQueries.Select(profileEntry => new ProfiledQuery
        {
            ConnectionId = connectionId,
            Timestamp = profileEntry["ts"].ToUniversalTime(),
            Collection = profileEntry["ns"].AsString,
            QueryShape = GetQueryShape(profileEntry),
            ExecutionTimeMs = profileEntry["millis"].ToInt32()
        }).ToList();

        return Ok(result);
    }

    [HttpGet("profiled-queries/{connectionId}/{collectionName}")]
    public async Task<ActionResult<IEnumerable<ProfiledQuery>>> GetProfiledQueriesByCollection(int connectionId, string collectionName)
    {
        var connection = await _context.MongoConnections.FindAsync(connectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(connection.DatabaseName);
        var profileCollection = database.GetCollection<BsonDocument>("system.profile");

        var filter = Builders<BsonDocument>.Filter.Eq("ns", $"{connection.DatabaseName}.{collectionName}");
        var sort = Builders<BsonDocument>.Sort.Descending("ts");

        var profiledQueries = await profileCollection.Find(filter)
            .Sort(sort)
            .Limit(100)
            .ToListAsync();

        var result = profiledQueries.Select(profileEntry => new ProfiledQuery
        {
            ConnectionId = connectionId,
            Timestamp = profileEntry["ts"].ToUniversalTime(),
            Collection = profileEntry["ns"].AsString,
            QueryShape = GetQueryShape(profileEntry),
            ExecutionTimeMs = profileEntry["millis"].ToInt32()
        }).ToList();

        return Ok(result);
    }

    [HttpPost("start-profiling/{connectionId}")]
    public async Task<ActionResult> StartProfiling(int connectionId)
    {
        var connection = await _context.MongoConnections.FindAsync(connectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(connection.DatabaseName);

        try
        {
            // Clear previous profiled queries from system.profile
            //var profileCollection = database.GetCollection<BsonDocument>("system.profile");
            //await profileCollection.DeleteManyAsync(Builders<BsonDocument>.Filter.Empty);

            // Enable profiling
            var command = new BsonDocument
            {
                { "profile", 2 },
                { "slowms", 0 }
            };
            await database.RunCommandAsync<BsonDocument>(command);

            // Update connection status
            connection.IsProfilingActive = true;
            await _context.SaveChangesAsync();
        }
        catch (Exception e)
        {
            return StatusCode(500, $"Failed to start profiling: {e.Message}");
        }

        _profilerService.StartProfiling(connectionId);
        return Ok("Profiling started successfully");
    }

    [HttpPost("stop-profiling/{connectionId}")]
    public async Task<ActionResult> StopProfiling(int connectionId)
    {
        var connection = await _context.MongoConnections.FindAsync(connectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(connection.DatabaseName);

        try
        {
            // Disable profiling
            var command = new BsonDocument
            {
                { "profile", 0 }
            };
            await database.RunCommandAsync<BsonDocument>(command);

            // Update connection status
            connection.IsProfilingActive = false;
            await _context.SaveChangesAsync();
        }
        catch (Exception e)
        {
            return StatusCode(500, $"Failed to stop profiling: {e.Message}");
        }

        _profilerService.StopProfiling(connectionId);
        return Ok("Profiling stopped successfully");
    }

    [HttpGet("profiling-status/{connectionId}")]
    public async Task<ActionResult<bool>> GetProfilingStatus(int connectionId)
    {
        var connection = await _context.MongoConnections.FindAsync(connectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        return Ok(connection.IsProfilingActive);
    }

    private string GetQueryShape(BsonDocument profileEntry)
    {
        if (profileEntry.Contains("query"))
        {
            var query = profileEntry["query"].ToJson();
            return $"db.{profileEntry["ns"].AsString}.find({query})";
        }
        else if (profileEntry.Contains("command"))
        {
            var command = profileEntry["command"].AsBsonDocument;
            return QueryShapeConverter.ToShellCommand(command, profileEntry["ns"].AsString);
        }
        return "Unsupported query type";
    }

    [HttpPost("suggest-indexes")]
    public async Task<ActionResult<List<string>>> SuggestIndexes([FromBody] SuggestIndexesRequest request)
    {
        if (string.IsNullOrEmpty(request.Query))
        {
            return BadRequest("Query is required.");
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var settings = await _context.AIProviderSettings.FirstOrDefaultAsync(x => x.UserId == userId);

        if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
        {
            return StatusCode(500, "AI provider is not configured. Please go to AI Provider Settings to configure your AI service.");
        }

        try
        {
            var aiService = AIProviderFactory.CreateProvider(settings);
            var prompt = $"Suggest MongoDB indexes for the following query: {request.Query} . " +
                        "Provide only the indexes in json array [collectionName: string,index:jsonObject] without any additional explanation.";
            
            var generatedQuery = await aiService.GenerateQueryAsync(prompt, settings.Model);
            generatedQuery = ExtractQueryFromCodeBlock(generatedQuery);
            return Ok(generatedQuery);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Failed to generate indexes: {ex.Message}");
        }
    }

    public class SuggestIndexesRequest
    {
        public string Query { get; set; }
    }

    [HttpGet("query-logs/suggest-indexes/{logId}")]
    public async Task<ActionResult<List<string>>> SuggestIndexesForQueryLogs(int logId)
    {
        var log = _context.QueryLogs
                          .Include(ql => ql.Query)
                          .Where(ql => ql.Id == logId)
                          .FirstOrDefault();
        if (log == null)
        {
            return NotFound();
        }
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var settings = await _context.AIProviderSettings.FirstOrDefaultAsync(x => x.UserId == userId);

        if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
        {
            return StatusCode(500, "AI provider is not configured. Please go to AI Provider Settings to configure your AI service.");
        }

        try
        {
            var aiService = AIProviderFactory.CreateProvider(settings);
            string queryText = $"db.getCollection(\"{log.Query.CollectionName}\").aggregate([{log.QueryText}])";
            var prompt = $"Suggest MongoDB indexes for the following query: {log.QueryText} . " +
                        "Provide only the indexes in json array [collectionName: string,index:jsonObject] without any additional explanation.";
            
            var generatedQuery = await aiService.GenerateQueryAsync(prompt, settings.Model);
            generatedQuery = ExtractQueryFromCodeBlock(generatedQuery);
            return Ok(generatedQuery);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Failed to generate indexes: {ex.Message}");
        }
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


    [HttpPost("create-index")]
    public async Task<ActionResult> CreateIndex([FromBody] CreateIndexRequest request)
    {
        var connection = await _context.MongoConnections.FindAsync(request.ConnectionId);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(connection.DatabaseName);
        var collection = database.GetCollection<BsonDocument>(request.Collection);

        var newIndexDefinition = BsonDocument.Parse(request.Pipeline);
        var newIndexKeys = new BsonDocumentIndexKeysDefinition<BsonDocument>(newIndexDefinition);

        // Check if an index with the same keys already exists
        var existingIndexes = await collection.Indexes.ListAsync();
        var existingIndexesList = await existingIndexes.ToListAsync();

        foreach (var index in existingIndexesList)
        {
            if (index["key"].AsBsonDocument.Elements.SequenceEqual(newIndexDefinition.Elements))
            {
                return Conflict("Index already exists");
            }
        }

        await collection.Indexes.CreateOneAsync(new CreateIndexModel<BsonDocument>(newIndexKeys));

        return Ok();
    }

    [HttpPost("query-logs/create-index")]
    public async Task<ActionResult> CreateIndexForQueryLogs([FromBody] CreateIndexRequestForQueryLogs request)
    {
        var query = await _context.Queries.Include(q => q.Connection).FirstOrDefaultAsync(q => q.Id == request.QueryId);
        if (query == null)
        {
            return NotFound("Connection not found");
        }

        var mongoConnectionUrl = new MongoUrl(query.Connection.ConnectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(query.Connection.DatabaseName);
        var collection = database.GetCollection<BsonDocument>(request.Collection);

        var newIndexDefinition = BsonDocument.Parse(request.Pipeline);
        var newIndexKeys = new BsonDocumentIndexKeysDefinition<BsonDocument>(newIndexDefinition);

        // Check if an index with the same keys already exists
        var existingIndexes = await collection.Indexes.ListAsync();
        var existingIndexesList = await existingIndexes.ToListAsync();

        foreach (var index in existingIndexesList)
        {
            if (index["key"].AsBsonDocument.Elements.SequenceEqual(newIndexDefinition.Elements))
            {
                return Conflict("Index already exists");
            }
        }

        await collection.Indexes.CreateOneAsync(new CreateIndexModel<BsonDocument>(newIndexKeys));

        return Ok();
    }
}

public class CreateIndexRequest
{
    public int ConnectionId { get; set; }
    public string Collection { get; set; }
    public string Pipeline { get; set; }
}

public class CreateIndexRequestForQueryLogs
{
    public int QueryId { get; set; }
    public string Pipeline { get; set; }
    public string Collection { get; set; }
}


public class ProfiledQuery
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ConnectionId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Collection { get; set; }
    public string QueryShape { get; set; }
    public int ExecutionTimeMs { get; set; }
}

