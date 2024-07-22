using Backend;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Mongo Browser APIs",
        Version = "v1",
        Description = "API for Mongo Browser application",
    });
});




builder.Services.AddSignalR();

string allowedOriginsEnv = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:3000";
string[] allowedOrigins = allowedOriginsEnv.Split(',');

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins(allowedOrigins)
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

// Add hosted service
builder.Services.AddSingleton<QueryProfilerService>();

var app = builder.Build();

// Enable Swagger and SwaggerUI in all environments

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Mongo Browser API V1");
    c.RoutePrefix = "docs";
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// Conditionally apply HTTPS redirection
if (Environment.GetEnvironmentVariable("USE_HTTPS") == "true")
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseAuthorization();
app.UseRouting();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapHub<QueryProfilerHub>("/queryProfilerHub");
});

app.MapControllers();

app.Run();


// ApplicationDbContext definition
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<MongoConnection> MongoConnections { get; set; }
    public DbSet<Query> Queries { get; set; }
    public DbSet<QueryLog> QueryLogs { get; set; }
    public DbSet<ProfiledQuery> ProfiledQueries { get; set; }
    public DbSet<OpenAISettings> OpenAISettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<QueryLog>()
                    .HasOne(ql => ql.Query)
                    .WithMany(q => q.QueryLogs)
                    .HasForeignKey(ql => ql.QueryId);

        modelBuilder.Entity<OpenAISettings>().HasData(
            new OpenAISettings { Id = 1, ApiKey = "", Model = "" }
        );
    }
}