using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using MongoDB.Driver;
using MongoDB.Driver.Core.Events;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Xml;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

[ApiController]
[Route("api/[controller]")]
public class MongoSchemaController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MongoSchemaController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{connectionId}")]
    public ActionResult<SchemaResponse> GetSchema(int connectionId, [FromQuery] List<string> includedCollections)
    {
        try
        {
            var connection = _context.MongoConnections.Find(connectionId);
            if (connection == null)
            {
                return NotFound("Connection not found");
            }

            var (formattedSchema, nonFormattedSchema) = ReadSchema(connection.ConnectionString, connection.DatabaseName, includedCollections);
            return Ok(new SchemaResponse
            {
                FormattedSchema = formattedSchema,
                NonFormattedSchema = nonFormattedSchema
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"An error occurred: {ex.Message}");
        }
    }

    [HttpGet("{connectionId}/collections")]
    public async Task<ActionResult<List<string>>> GetCollections(int connectionId, [FromQuery] string search = "")
    {
        try
        {
            var connection = await _context.MongoConnections.FindAsync(connectionId);
            if (connection == null)
            {
                return NotFound("Connection not found");
            }

            var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
            var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
            mongoClientSettings.AllowInsecureTls = true;
            var client = new MongoClient(mongoClientSettings);
            var database = client.GetDatabase(connection.DatabaseName);
            var collections = await database.ListCollectionNamesAsync();
            var collectionList = await collections.ToListAsync();

            // Filter collections based on the search parameter
            if (!string.IsNullOrWhiteSpace(search))
            {
                collectionList = collectionList
                    .Where(c => c.Contains(search, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return Ok(collectionList);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"An error occurred: {ex.Message}");
        }
    }

    private (string formattedSchema, string nonFormattedSchema) ReadSchema(string connectionString, string databaseName, List<string> includedCollections)
    {
        var mongoConnectionUrl = new MongoUrl(connectionString);
        var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
        mongoClientSettings.AllowInsecureTls = true;
        var mongoClient = new MongoClient(mongoClientSettings);
        var database = mongoClient.GetDatabase(databaseName);
        var collections = database.ListCollectionNames().ToList();
        var schemaDictionary = new Dictionary<string, object>();
        foreach (var collectionName in collections)
        {
            if (includedCollections.Contains(collectionName) || includedCollections.Count == 0)
            {
                var collection = database.GetCollection<BsonDocument>(collectionName);
                var sampleDocument = collection.Find(new BsonDocument())
                                               .Sort(Builders<BsonDocument>.Sort.Descending(d => d.ElementCount))
                                               .FirstOrDefault();
                if (sampleDocument != null)
                {
                    var schema = InferSchemaFromDocument(sampleDocument);
                    schemaDictionary.Add(collectionName, schema);
                }
            }
        }
        string formattedJsonSchema = Newtonsoft.Json.JsonConvert.SerializeObject(schemaDictionary, Newtonsoft.Json.Formatting.Indented);
        string nonFormattedJsonSchema = Newtonsoft.Json.JsonConvert.SerializeObject(schemaDictionary, Newtonsoft.Json.Formatting.None);
        return (formattedJsonSchema, nonFormattedJsonSchema);
    }

    static object InferSchemaFromDocument(BsonDocument document)
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

    static object InferSchemaFromArray(BsonArray array)
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


    public class SchemaResponse
    {
        public string FormattedSchema { get; set; }
        public string NonFormattedSchema { get; set; }
    }

}