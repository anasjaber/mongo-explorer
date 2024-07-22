using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using MongoDB.Bson;
using Microsoft.AspNetCore.SignalR;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

public class QueryProfilerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IHubContext<QueryProfilerHub> _hubContext;
    private readonly ConcurrentDictionary<int, CancellationTokenSource> _profilingTasks = new ConcurrentDictionary<int, CancellationTokenSource>();

    public QueryProfilerService(IServiceProvider services, IHubContext<QueryProfilerHub> hubContext)
    {
        _services = services;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    public void StartProfiling(int connectionId)
    {
        var cts = new CancellationTokenSource();
        if (_profilingTasks.TryAdd(connectionId, cts))
        {
            Task.Run(() => ProfileConnection(connectionId, cts.Token));
        }
    }

    public void StopProfiling(int connectionId)
    {
        if (_profilingTasks.TryRemove(connectionId, out var cts))
        {
            cts.Cancel();
            cts.Dispose();

            using (var scope = _services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var connection = dbContext.MongoConnections.Find(connectionId);

                if (connection != null)
                {
                    var settings = MongoClientSettings.FromConnectionString(connection.ConnectionString);
                    settings.SslSettings = new SslSettings
                    {
                        ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true
                    };
                    var mongoClient = new MongoClient(settings);
                    var database = mongoClient.GetDatabase(connection.DatabaseName);
                    MongoDbProfiler.DisableProfiling(database);
                }
            }
        }
    }

    private async Task ProfileConnection(int connectionId, CancellationToken cancellationToken)
    {
        try
        {
            using (var scope = _services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var connection = await dbContext.MongoConnections.FindAsync(connectionId);

                if (connection == null)
                {
                    return;
                }

                var settings = MongoClientSettings.FromConnectionString(connection.ConnectionString);
                settings.SslSettings = new SslSettings
                {
                    ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true
                };
                var mongoClient = new MongoClient(settings);
                var database = mongoClient.GetDatabase(connection.DatabaseName);

                // Configure system.profile to not log itself
                ConfigureSystemProfile(database);

                // Enable profiling
                MongoDbProfiler.EnableProfiling(database, ProfilingLevel.All);

                var profileCollection = database.GetCollection<BsonDocument>("system.profile");

                // Create a tailable cursor
                var options = new FindOptions<BsonDocument>
                {
                    CursorType = CursorType.TailableAwait,
                    NoCursorTimeout = true
                };

                var filter = new BsonDocument();
                var lastTimestamp = DateTime.UtcNow;

                using (var cursor = await profileCollection.FindAsync(filter, options, cancellationToken))
                {
                    while (await cursor.MoveNextAsync(cancellationToken))
                    {
                        var batch = cursor.Current;
                        foreach (var document in batch)
                        {
                            var timestamp = document["ts"].ToUniversalTime();
                            if (timestamp > lastTimestamp)
                            {
                                lastTimestamp = timestamp;
                                var profiledQuery = new ProfiledQuery
                                {
                                    ConnectionId = connectionId,
                                    Timestamp = timestamp,
                                    Collection = document["ns"].AsString,
                                    QueryShape = GetQueryShape(document),
                                    ExecutionTimeMs = document["millis"].ToInt32()
                                };

                                // Only send if it's not an unsupported query type and not from system.profile
                                if (profiledQuery.QueryShape != "Unsupported query type" && profiledQuery.QueryShape != "Unsupported command type" &&
                                    !profiledQuery.Collection.EndsWith(".system.profile"))
                                {
                                    // Send real-time update via SignalR
                                    await _hubContext.Clients.All.SendAsync("ReceiveProfiledQuery", profiledQuery, cancellationToken);
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }
    }

    private void ConfigureSystemProfile(IMongoDatabase database)
    {
        var command = new BsonDocument
        {
            { "profile", 0 },
            { "slowms", 100 },
            { "filter", new BsonDocument
                {
                    { "ns", new BsonDocument
                        {
                            { "$ne", $"{database.DatabaseNamespace.DatabaseName}.system.profile" }
                        }
                    }
                }
            }
        };

        database.RunCommand<BsonDocument>(command);
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
}

// SignalR Hub
public class QueryProfilerHub : Hub
{
}