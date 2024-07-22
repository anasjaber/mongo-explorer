using MongoDB.Driver;
using MongoDB.Bson;

public class MongoDbProfiler
{
    public static void EnableProfiling(IMongoDatabase database, ProfilingLevel level, int? slowMs = null)
    {
        var command = new BsonDocument
        {
            { "profile", (int)level }
        };

        if (slowMs.HasValue)
        {
            command.Add("slowms", slowMs.Value);
        }

        database.RunCommand<BsonDocument>(command);
    }

    public static void DisableProfiling(IMongoDatabase database)
    {
        EnableProfiling(database, ProfilingLevel.Off);
    }
}

public enum ProfilingLevel
{
    Off = 0,
    SlowOnly = 1,
    All = 2
}