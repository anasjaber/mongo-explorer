using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using MongoDB.Driver;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MongoConnectionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MongoConnectionController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<MongoConnection>>> GetConnections([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var totalConnections = await _context.MongoConnections.CountAsync(x=>x.UserId == userId);
        var totalPages = (int)Math.Ceiling(totalConnections / (double)pageSize);

        var connections = await _context.MongoConnections
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Where(x => x.UserId == userId)
            .ToListAsync();

        var result = new PaginatedResult<MongoConnection>
        {
            Items = connections,
            TotalItems = totalConnections,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MongoConnection>> GetConnection(int id)
    {
        var connection = await _context.MongoConnections.FindAsync(id);
        if (connection == null)
        {
            return NotFound();
        }
        return connection;
    }

    [HttpPost]
    public async Task<ActionResult<MongoConnection>> CreateConnection(MongoConnection connection)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        connection.UserId = userId;
        _context.MongoConnections.Add(connection);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetConnection), new { id = connection.Id }, connection);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateConnection(int id, MongoConnection connection)
    {
        if (id != connection.Id)
        {
            return BadRequest();
        }
        _context.Entry(connection).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ConnectionExists(id))
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
    public async Task<IActionResult> DeleteConnection(int id)
    {
        var connection = await _context.MongoConnections.FindAsync(id);
        if (connection == null)
        {
            return NotFound();
        }
        _context.MongoConnections.Remove(connection);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("test")]
    public async Task<IActionResult> TestConnection(MongoConnection connection)
    {
        try
        {
            var mongoConnectionUrl = new MongoUrl(connection.ConnectionString);
            var mongoUrl = MongoUrl.Create(connection.ConnectionString);
            var mongoClientSettings = MongoClientSettings.FromUrl(mongoConnectionUrl);
            mongoClientSettings.AllowInsecureTls = true;
            var mongoClient = new MongoClient(mongoClientSettings);

            var database = mongoClient.GetDatabase(connection.DatabaseName);
            await database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1));
            return Ok("Connection successful");
        }
        catch (Exception ex)
        {
            return BadRequest($"Connection failed: {ex.Message}");
        }
    }

    [HttpGet("{id}/collections")]
    public async Task<ActionResult<List<string>>> GetCollections(int id)
    {
        var connection = await _context.MongoConnections.FindAsync(id);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var settings = MongoClientSettings.FromConnectionString(connection.ConnectionString);
        settings.SslSettings = new SslSettings
        {
            ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true
        };
        var client = new MongoClient(settings);
        var database = client.GetDatabase(connection.DatabaseName);
        var collections = await database.ListCollectionNamesAsync();
        var collectionList = await collections.ToListAsync();

        return Ok(collectionList);
    }

    [HttpGet("{id}/collections/{collectionName}/fields")]
    public async Task<ActionResult<List<FieldInfo>>> GetCollectionFields(int id, string collectionName)
    {
        var connection = await _context.MongoConnections.FindAsync(id);
        if (connection == null)
        {
            return NotFound("Connection not found");
        }

        var settings = MongoClientSettings.FromConnectionString(connection.ConnectionString);
        settings.SslSettings = new SslSettings
        {
            ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true
        };
        var client = new MongoClient(settings);
        var database = client.GetDatabase(connection.DatabaseName);
        var collection = database.GetCollection<BsonDocument>(collectionName);

        var sampleDocument = await collection.Find(new BsonDocument())
                                             .Limit(1)
                                             .FirstOrDefaultAsync();

        if (sampleDocument == null)
        {
            return Ok(new List<FieldInfo>());
        }

        var fields = sampleDocument.Elements.Select(element => new FieldInfo
        {
            Name = element.Name,
            Type = element.Value.BsonType.ToString()
        }).ToList();

        return Ok(fields);
    }

    public class FieldInfo
    {
        public string Name { get; set; }
        public string Type { get; set; }
    }

    private bool ConnectionExists(int id)
    {
        return _context.MongoConnections.Any(e => e.Id == id);
    }
}

public class MongoConnection
{
    public int Id { get; set; }

    public int UserId { get; set; }

    [Required]
    public string Name { get; set; }
    [Required]
    public string ConnectionString { get; set; }
    [Required]
    public string DatabaseName { get; set; }
    public bool IsProfilingActive { get; set; }

}