using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
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
            var settings = await _context.OpenAISettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                return NotFound();
            }
            return Ok(settings);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings(OpenAISettings updatedSettings)
        {
            var settings = await _context.OpenAISettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                return NotFound();
            }

            settings.ApiKey = updatedSettings.ApiKey;
            settings.Model = updatedSettings.Model;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


public class OpenAISettings
{
    public int Id { get; set; }
    public string ApiKey { get; set; }
    public string Model { get; set; }
}