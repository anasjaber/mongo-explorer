using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OpenAISettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OpenAISettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<OpenAISettings>> GetSettings()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var settings = await _context.OpenAISettings.FirstOrDefaultAsync(x => x.UserId == userId);

            if (settings == null)
            {
                return Ok(new OpenAISettings());
            }
            return Ok(settings);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings(OpenAISettings updatedSettings)
        {
            var userId =int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var settings = await _context.OpenAISettings.FirstOrDefaultAsync(x=>x.UserId == userId);
            if (settings == null)
            {
                settings = new OpenAISettings();
            }

            settings.ApiKey = updatedSettings.ApiKey;
            settings.Model = updatedSettings.Model;
            settings.UserId = userId;

            if(settings.Id == 0)
            {
                await _context.OpenAISettings.AddAsync(settings);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


public class OpenAISettings
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ApiKey { get; set; }
    public string Model { get; set; }
}