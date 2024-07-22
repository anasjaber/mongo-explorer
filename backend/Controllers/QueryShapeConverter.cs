using MongoDB.Bson;
using Newtonsoft.Json.Linq;
using System.Text;

public static class QueryShapeConverter
{
    public static string ToShellCommand(BsonDocument command, string collectionName)
    {
        if (command.Contains("find"))
        {
            var filterDoc = command["filter"].ToJson();
            return $"db.{command["find"]}.find({filterDoc})";
        }
        else if (command.Contains("aggregate"))
        {
            var pipeline = command["pipeline"].ToJson();
            return $"db.{command["aggregate"]}.aggregate({pipeline})";
        }
        else if (command.Contains("count"))
        {
            var filterDoc = command.Contains("query") ? command["query"].ToJson() : "{}";
            return $"db.{command["count"]}.count({filterDoc})";
        }
        else if (command.Contains("distinct"))
        {
            var filterDoc = command.Contains("query") ? command["query"].ToJson() : "{}";
            return $"db.{command["distinct"]}.distinct(\"{command["key"]}\", {filterDoc})";
        }
        //else if (command.Contains("update"))
        //{
        //    var updates = command["updates"].AsBsonArray;
        //    var updateStr = updates.ToJson();
        //    return $"db.{command["update"]}.update({updateStr})";
        //}
        //else if (command.Contains("delete"))
        //{
        //    var deletes = command["deletes"].AsBsonArray;
        //    var deleteStr = deletes.ToJson();
        //    return $"db.{command["delete"]}.remove({deleteStr})";
        //}
        else
        {
            return "Unsupported command type";
        }

    }
}