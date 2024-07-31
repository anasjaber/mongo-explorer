using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson.IO;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Formats.Asn1;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using CsvHelper;
using Newtonsoft.Json.Linq;
using MongoDB.Bson.Serialization;
using Microsoft.AspNetCore.Http;
using System.Collections;
using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QueryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public QueryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Query>>> GetQueries(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string filter = "",
    [FromQuery] bool favoritesOnly = false)
    {
        if (page < 1)
        {
            return BadRequest("Page number must be greater than 0.");
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest("Page size must be between 1 and 100.");
        }

        IQueryable<Query> query = _context.Queries;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        query = query.Where(q => q.UserId == userId);
        if (!string.IsNullOrEmpty(filter))
        {
            query = query.Where(q =>
                q.Title.Contains(filter) ||
                q.Description.Contains(filter) ||
                q.CollectionName.Contains(filter) ||
                q.Connection.Name.Contains(filter)
            );
        }

        if (favoritesOnly)
        {
            query = query.Where(q => q.IsFavourite);
        }

        var totalQueries = await query.CountAsync(q=>q.UserId==userId);
        var totalPages = (int)Math.Ceiling(totalQueries / (double)pageSize);

        var queries = await query
            .OrderByDescending(q => q.LastRun)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(q => q.Connection) // Include connection info
            .ToListAsync();

        var result = new PaginatedResult<Query>
        {
            Items = queries,
            TotalItems = totalQueries,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        return Ok(result);
    }

    [HttpGet("favorites")]
    public async Task<ActionResult<List<Query>>> GetFavoriteQueries([FromQuery] string filter = "")
    {
        IQueryable<Query> query = _context.Queries.Where(q => q.IsFavourite);

        if (!string.IsNullOrEmpty(filter))
        {
            query = query.Where(q =>
                q.Title.Contains(filter) ||
                q.Description.Contains(filter) ||
                q.CollectionName.Contains(filter) ||
                q.Connection.Name.Contains(filter)
            );
        }

        var favoriteQueries = await query
            .OrderByDescending(q => q.LastRun)
            .Include(q => q.Connection) // Include connection info
            .ToListAsync();

        return Ok(favoriteQueries);
    }



    [HttpPost]
    public async Task<ActionResult<Query>> CreateQuery(QueryCreateDto queryDto)
    {
        var connection = await _context.MongoConnections.FindAsync(queryDto.ConnectionId);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var query = new Query
        {
            ConnectionId = queryDto.ConnectionId,
            Title = queryDto.Title,
            Description = queryDto.Description,
            QueryText = queryDto.QueryText,
            CollectionName = queryDto.CollectionName,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        _context.Queries.Add(query);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuery), new { id = query.Id }, query);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditQuery(int id, QueryEditDto queryDto)
    {
        var query = await _context.Queries.FindAsync(id);
        if (query == null)
        {
            return NotFound("Query not found");
        }

        query.Title = queryDto.Title;
        query.Description = queryDto.Description;
        query.QueryText = queryDto.QueryText;
        query.CollectionName = queryDto.CollectionName;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!QueryExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuery(int id)
    {
        var query = await _context.Queries.FindAsync(id);
        if (query == null)
        {
            return NotFound("Query not found");
        }

        _context.Queries.Remove(query);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool QueryExists(int id)
    {
        return _context.Queries.Any(e => e.Id == id);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Query>> GetQuery(int id)
    {
        var query = await _context.Queries.FindAsync(id);

        if (query == null)
        {
            return NotFound();
        }

        return query;
    }

    [HttpPost("{id}/execute")]
    public async Task<ActionResult<List<Dictionary<string, object>>>> ExecuteQuery(int id)
    {
        var result = await ExecuteQueryInternal(id);
        if (result.Error != null)
        {
            return BadRequest(result.Error);
        }

        var query = await _context.Queries.FindAsync(id);
        if (query != null)
        {
            query.LastRun = DateTime.UtcNow;
            query.RunCount += 1;
            await _context.SaveChangesAsync();
        }

        return Ok(result.Data);
    }

    [HttpPost("{id}/format")]
    public async Task<ActionResult<string>> FormatQuery(int id)
    {
        var query = await _context.Queries.FindAsync(id);
        if (query == null)
        {
            return NotFound("Query not found");
        }

        try
        {
            // Parse the query text as JSON
            var jsonArray = JArray.Parse(query.QueryText);

            // Format the JSON with indentation
            var formattedQuery = jsonArray.ToString(Formatting.Indented);

            return Ok(formattedQuery);
        }
        catch (JsonException ex)
        {
            return BadRequest($"Error formatting query: {ex.Message}");
        }
    }


    [HttpGet("{id}/download/csv")]
    public async Task<IActionResult> DownloadQueryAsCsv(int id)
    {
        var result = await ExecuteQueryInternal(id);
        if (result.Error != null)
        {
            return BadRequest(result.Error);
        }

        var stream = new MemoryStream();
        var writer = new StreamWriter(stream);
        var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        // Write headers
        var headers = result.Data.SelectMany(d => d.Keys).Distinct().ToList();
        foreach (var header in headers)
        {
            csv.WriteField(header);
        }
        csv.NextRecord();

        // Write data
        foreach (var item in result.Data)
        {
            foreach (var header in headers)
            {
                if (item.TryGetValue(header, out var value))
                {
                    csv.WriteField(value);
                }
                else
                {
                    csv.WriteField(string.Empty);
                }
            }
            csv.NextRecord();
        }

        writer.Flush();
        stream.Position = 0;

        return File(stream, "text/csv", $"query_result_{id}.csv");
    }



    [HttpGet("{id}/download-json")]
    public async Task<IActionResult> DownloadQueryAsJson(int id)
    {
        var result = await ExecuteQueryInternal(id);
        if (result.Error != null)
        {
            return BadRequest(result.Error);
        }

        var jsonResult = Newtonsoft.Json.JsonConvert.SerializeObject(result.Data, Newtonsoft.Json.Formatting.Indented);
        var bytes = System.Text.Encoding.UTF8.GetBytes(jsonResult);
        var stream = new MemoryStream(bytes);

        return File(stream, "application/json", $"query_result_{id}.json");
    }


    [HttpPost("{id}/favourite")]
    public async Task<IActionResult> AddToFavourite(int id, [FromBody] FavouriteRequest request)
    {
        var query = await _context.Queries.FindAsync(id);
        if (query == null)
        {
            return NotFound();
        }

        query.IsFavourite = request.IsFavourite;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!QueryExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }
        return NoContent();
    }


    private async Task<(List<Dictionary<string, object>> Data, string Error)> ExecuteQueryInternal(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var query = await _context.Queries.Include(q => q.Connection).FirstOrDefaultAsync(q => q.Id == id);
        if (query == null)
        {
            return (null, "Query not found");
        }

        var settings = MongoClientSettings.FromConnectionString(query.Connection.ConnectionString);
        settings.SslSettings = new SslSettings
        {
            ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true
        };
        var client = new MongoClient(settings);
        var database = client.GetDatabase(query.Connection.DatabaseName);
        var collection = database.GetCollection<BsonDocument>(query.CollectionName);

        try
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            // Extract the JSON array part of the aggregation pipeline
            var startIndex = query.QueryText.IndexOf('[');
            var endIndex = query.QueryText.LastIndexOf(']') + 1;
            var jsonArrayString = query.QueryText.Substring(startIndex, endIndex - startIndex);

            // Convert the JSON array string to a BsonArray
            var bsonArray = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonArray>(jsonArrayString);

            // Convert BsonArray to IEnumerable<BsonDocument>
            var documents = bsonArray.Select(bsonElement => bsonElement.AsBsonDocument).ToList();

            // Create a PipelineDefinition from the documents
            var pipeline = PipelineDefinition<BsonDocument, BsonDocument>.Create(documents);

            // Execute the aggregation query
            var result = await collection.Aggregate(pipeline).ToListAsync();

            stopwatch.Stop();

            // Log the query execution
            var queryLog = new QueryLog
            {
                QueryId = query.Id,
                RunAt = DateTime.UtcNow,
                RunBy = User.Identity.Name ?? "Anonymous", // Assuming you have authentication set up
                Duration = stopwatch.Elapsed,
                QueryText = query.QueryText,
                UserId = userId
            };

            _context.QueryLogs.Add(queryLog);
            await _context.SaveChangesAsync();

            // Convert the result to a list of dictionaries
            var formattedResult = result.Select(BsonDocumentToDictionary).ToList();

            return (formattedResult, null);
        }
        catch (Exception ex)
        {
            return (null, $"Error executing query: {ex.Message}");
        }
    }

    private Dictionary<string, object> BsonDocumentToDictionary(BsonDocument document)
    {
        var dictionary = new Dictionary<string, object>();
        foreach (var element in document.Elements)
        {
            dictionary[element.Name] = BsonTypeMapper.MapToDotNetValue(element.Value);
        }
        return dictionary;
    }

    private object BsonValueToObject(BsonValue value)
    {
        switch (value.BsonType)
        {
            case BsonType.ObjectId:
                return value.AsObjectId.ToString();
            case BsonType.DateTime:
                return value.ToUniversalTime();
            case BsonType.Array:
                return value.AsBsonArray.Select(BsonValueToObject).ToList();
            case BsonType.Document:
                return BsonDocumentToDictionary(value.AsBsonDocument);
            default:
                return BsonTypeMapper.MapToDotNetValue(value);
        }
    }
}

public class QueryCreateDto
{
    public int ConnectionId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string QueryText { get; set; }
    public string CollectionName { get; set; }
}

public class PaginatedResult<T>
{
    public List<T> Items { get; set; }
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class QueryEditDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string QueryText { get; set; }
    public string CollectionName { get; set; }
}

public class FavouriteRequest
{
    public bool IsFavourite { get; set; }
}


public class Query
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ConnectionId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string QueryText { get; set; }
    public string CollectionName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastRun { get; set; } // New column
    public int RunCount { get; set; } // New column
    public bool IsFavourite { get; set; } // New column

    public MongoConnection Connection { get; set; }
    public List<QueryLog> QueryLogs { get; set; }
}