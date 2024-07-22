using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class QueryLogController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public QueryLogController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<QueryLog>> AddQueryLog(QueryLogDto logDto)
    {
        var query = await _context.Queries.FindAsync(logDto.QueryId);
        if (query == null)
        {
            return NotFound("Query not found");
        }

        var queryLog = new QueryLog
        {
            RunAt = DateTime.UtcNow,
            RunBy = logDto.RunBy,
            Duration = logDto.Duration,
            QueryText = logDto.QueryText,
            QueryId = logDto.QueryId
        };

        _context.QueryLogs.Add(queryLog);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQueryLog), new { id = queryLog.Id }, queryLog);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QueryLog>> GetQueryLog(int id)
    {
        var queryLog = await _context.QueryLogs.FindAsync(id);

        if (queryLog == null)
        {
            return NotFound();
        }

        return queryLog;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<QueryLogDto>>> ListQueryLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string filter = "")
    {
        var queryLogs = _context.QueryLogs.AsQueryable();

        if (!string.IsNullOrEmpty(filter))
        {
            queryLogs = queryLogs.Where(l =>
                l.RunBy.Contains(filter) ||
                l.QueryText.Contains(filter) ||
                l.Query.Title.Contains(filter)); // Filter by the query title
        }

        var totalLogs = await queryLogs.CountAsync();
        var totalPages = (int)Math.Ceiling(totalLogs / (double)pageSize);

        var logs = await queryLogs
            .Include(l => l.Query) // Include related Query
            .OrderByDescending(l => l.RunAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(log => new QueryLogDto  // Project to DTO
            {
                Id = log.Id,
                RunAt = log.RunAt,
                RunBy = log.RunBy,
                Duration = log.Duration,
                QueryText = log.QueryText,
                QueryId = log.Query.Id,
                QueryName = log.Query.Title  // Include Query name
            })
            .ToListAsync();

        var result = new PaginatedResult<QueryLogDto>
        {
            Items = logs,
            TotalItems = totalLogs,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        return Ok(result);
    }

    

}

// Add new DTO class
public class QueryLogDto
{
    public int Id { get; set; }
    public DateTime RunAt { get; set; }
    public string RunBy { get; set; }
    public TimeSpan Duration { get; set; }
    public string QueryText { get; set; }
    public int QueryId { get; set; }
    public string QueryName { get; set; } // New property for Query name
}


public class QueryLog
{
    public int Id { get; set; }
    public DateTime RunAt { get; set; }
    public string RunBy { get; set; }
    public TimeSpan Duration { get; set; }
    public string QueryText { get; set; }
    public int QueryId { get; set; }

    public Query Query { get; set; }
}