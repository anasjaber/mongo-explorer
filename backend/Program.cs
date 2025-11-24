using Backend;
using Backend.Controllers;
using Backend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

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
        Title = "Mongo Explorer APIs",
        Version = "v1",
        Description = "API for Mongo Explorer application",
    });
});




builder.Services.AddSignalR();

string allowedOriginsEnv = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002";
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

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddJwtBearer(options =>
       {
           options.TokenValidationParameters = new TokenValidationParameters
           {
               ValidateIssuerSigningKey = true,
               IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(builder.Configuration["JwtConfig:secret"])),
               ValidateIssuer = false,
               ValidateAudience = false
           };
       });

builder.Services.AddScoped<JwtService>();

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
app.UseAuthentication();
app.UseRouting();

app.UseAuthorization();

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
    public DbSet<OpenAISettings> OpenAISettings { get; set; } // Keep for backward compatibility
    public DbSet<AIProviderSettings> AIProviderSettings { get; set; }
    public DbSet<User> Users { get; set; }


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