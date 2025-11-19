# CLAUDE.md - MongoDB Explorer Codebase Guide

**Last Updated**: November 19, 2025

This document provides a comprehensive guide to the MongoDB Explorer codebase for AI assistants. It covers architecture, conventions, development workflows, and key patterns to follow when working with this project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Tech Stack](#tech-stack)
5. [Development Setup](#development-setup)
6. [Key Components](#key-components)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Frontend Structure](#frontend-structure)
10. [Coding Conventions](#coding-conventions)
11. [Common Development Tasks](#common-development-tasks)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Important Notes](#important-notes)

---

## Project Overview

**Mongo Explorer** is a full-stack web application for exploring, managing, and optimizing MongoDB databases. It provides:

- Multi-instance MongoDB connection management
- Visual query builder and executor
- AI-powered query generation using OpenAI, OpenRouter, or Anthropic
- Real-time query profiling with SignalR
- Performance analysis and index suggestions
- Query history and favorites management
- Schema browsing and visualization

**Live Demo**: https://mongo-explorer.onrender.com/

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React SPA     │────────▶│  ASP.NET Core 8  │────────▶│   MongoDB       │
│   (Port 7072)   │  HTTP   │  API (Port 7073) │  Driver │   (User DBs)    │
│                 │◀────────│                  │◀────────│                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                           │
        │                           │
        │                    ┌──────▼───────┐
        │                    │   SQLite     │
        │                    │  (App Data)  │
        │                    └──────────────┘
        │
        └──────────────▶ SignalR Hub (Real-time profiling)
```

### Component Separation

- **Frontend**: React 18.3.1 with Chakra UI - Handles UI/UX and user interactions
- **Backend**: ASP.NET Core 8 - REST API, business logic, MongoDB operations
- **Database**: SQLite - Stores application data (connections, queries, users, settings)
- **MongoDB**: External user databases - Target databases for exploration
- **AI Providers**: OpenAI/OpenRouter/Anthropic - Query generation and optimization

---

## Directory Structure

```
/home/user/mongo-explorer/
│
├── backend/                        # ASP.NET Core 8 API
│   ├── Controllers/                # API controllers (8 controllers)
│   │   ├── AIProviderSettingsController.cs
│   │   ├── AIQueryGeneratorController.cs
│   │   ├── AuthController.cs
│   │   ├── MongoConnectionController.cs
│   │   ├── QueryController.cs
│   │   ├── QueryLogController.cs
│   │   └── QueryProfilerController.cs
│   ├── Models/                     # Data models
│   │   └── AIProviderSettings.cs
│   ├── Services/                   # Business logic
│   │   ├── AIProviderFactory.cs
│   │   ├── AnthropicService.cs
│   │   ├── OpenAIService.cs
│   │   └── OpenRouterService.cs
│   ├── BackgroundJobs/             # Hosted services
│   │   └── QueryProfilerService.cs
│   ├── Migrations/                 # EF Core migrations
│   ├── Properties/                 # Launch settings
│   ├── Dockerfile                  # Backend container
│   ├── Backend.csproj              # Project file
│   ├── appsettings.json            # Configuration
│   ├── appsettings.Development.json
│   └── Program.cs                  # Application entry point
│
├── frontend/                       # React application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── pages/                  # Page components (9 pages)
│   │   │   ├── ConnectionManager.jsx
│   │   │   ├── QueryManager.jsx
│   │   │   ├── AIQueryGenerator.jsx
│   │   │   ├── QueryProfiler.jsx
│   │   │   ├── QueryLogs.jsx
│   │   │   ├── OpenAISettings.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── QueryLogDetails.jsx
│   │   ├── components/             # Reusable components
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ConnectionModal.jsx
│   │   │   └── QueryModal.jsx
│   │   ├── api/                    # Axios configuration
│   │   │   └── axios.js
│   │   ├── App.jsx                 # Main app component
│   │   └── index.jsx               # React entry point
│   ├── Dockerfile                  # Frontend container
│   ├── package.json                # npm dependencies
│   ├── config-overrides.js         # Webpack overrides
│   └── .eslintrc.json              # ESLint config
│
├── screenshots/                    # Documentation images
├── docker-compose.yml              # Container orchestration
├── README.md                       # Project documentation
└── LICENSE                         # MIT License
```

---

## Tech Stack

### Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| ASP.NET Core | 8.0 | Web API framework |
| C# | 12.0 | Programming language |
| Entity Framework Core | 8.0.7 | ORM for SQLite |
| SQLite | - | Application database |
| MongoDB.Driver | 2.27.0 | MongoDB client library |
| OpenAI SDK | 1.11.0 | AI integration |
| SignalR | 8.0.7 | Real-time communication |
| BCrypt.Net | 0.1.0 | Password hashing |
| Swashbuckle | 6.4.0 | API documentation |
| CsvHelper | 33.0.1 | CSV export |
| Newtonsoft.Json | 13.0.3 | JSON serialization |

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| Chakra UI | 2.8.2 | Component library |
| React Router | 6.24.1 | Client-side routing |
| Axios | 1.7.2 | HTTP client |
| Monaco Editor | 0.50.0 | Code editor (VSCode-like) |
| React Ace | 12.0.0 | Alternative editor |
| SignalR Client | 8.0.7 | Real-time updates |
| Framer Motion | 11.3.2 | Animations |
| React JSON View | 1.21.3 | JSON visualization |
| React Query Builder | 7.4.1 | Query building UI |

### DevOps

- **Docker**: Multi-stage builds for both services
- **Docker Compose**: Orchestrates frontend + backend
- **Create React App**: Frontend build system (with rewiring)

---

## Development Setup

### Prerequisites

- Docker and Docker Compose
- OR Node.js 18+ and .NET 8 SDK

### Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/anasjaber/mongo-explorer.git
cd mongo-explorer

# Start all services
docker-compose up -d --build

# Access application
# Frontend: http://localhost:7072
# Backend API: http://localhost:7073/docs
```

### Local Development Setup

#### Backend

```bash
cd backend
dotnet restore
dotnet run
```

Backend runs on: http://localhost:7073

#### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:7072

### Environment Variables

#### Backend (docker-compose.yml)

```yaml
ASPNETCORE_ENVIRONMENT: Development
ASPNETCORE_URLS: http://+:7073
AllowedOrigins: http://localhost:7072
ConnectionStrings__DefaultConnection: "Data Source=app.db"
```

#### Frontend (docker-compose.yml)

```yaml
REACT_APP_API_URL: http://localhost:7073/api
```

---

## Key Components

### Backend Components

#### 1. Controllers

**MongoConnectionController.cs** (`/api/MongoConnection`)
- Manages MongoDB connection strings
- Tests connections
- Lists databases and collections
- Infers collection schemas

Key methods:
- `GET /` - List connections (paginated)
- `POST /` - Create connection
- `POST /test` - Test connection
- `GET /{id}/collections` - List collections
- `GET /{id}/collections/{name}/fields` - Get schema

**QueryController.cs** (`/api/Query`)
- CRUD operations for saved queries
- Query execution
- Result export (CSV, JSON)
- Favorites management

Key methods:
- `POST /{id}/execute` - Execute MongoDB aggregation
- `POST /{id}/format` - Format JSON query
- `GET /{id}/download/csv` - Export to CSV
- `POST /{id}/favourite` - Toggle favorite

**AIQueryGeneratorController.cs** (`/api/AIQueryGenerator`)
- Natural language to MongoDB query conversion
- Uses configured AI provider

**QueryProfilerController.cs** (`/api/QueryProfiler`)
- Real-time query profiling
- Index suggestions
- Index creation

Key methods:
- `POST /start-profiling/{connectionId}` - Enable profiling
- `POST /suggest-indexes` - AI-powered suggestions
- `POST /create-index` - Create index on collection

**AuthController.cs** (`/api/Auth`)
- User authentication with JWT
- Registration

#### 2. Services

**AIProviderFactory.cs**
- Factory pattern for AI providers
- Supports OpenAI, OpenRouter, Anthropic

**OpenAIService.cs / OpenRouterService.cs / AnthropicService.cs**
- AI provider implementations
- Query generation logic
- Index suggestion generation

**QueryProfilerService.cs** (Background Service)
- Monitors MongoDB profiling output
- Streams results via SignalR
- Runs continuously for active connections

#### 3. Models

**Core Entities**:
- `MongoConnection` - Connection details
- `Query` - Saved queries
- `QueryLog` - Execution history
- `User` - Authentication
- `AIProviderSettings` - AI configuration

#### 4. ApplicationDbContext

EF Core context managing SQLite database with:
- DbSet for each entity
- Relationships configured
- Migrations for schema updates

### Frontend Components

#### 1. Pages

**ConnectionManager.jsx** (/)
- Main dashboard
- Connection CRUD
- Connection testing
- Collection browsing

**QueryManager.jsx** (/queries)
- Query library
- Query execution
- Results visualization
- Export functionality

**AIQueryGenerator.jsx** (/ai-query-generator)
- Natural language input
- Schema selection
- AI-generated query preview
- Save to library

**QueryProfiler.jsx** (/query-profiler)
- Real-time profiling display
- SignalR integration
- Index suggestions
- One-click index creation

**QueryLogs.jsx** (/query-logs)
- Execution history
- Performance metrics
- Filtering and search

**OpenAISettings.jsx** (/openai-settings)
- AI provider configuration
- API key management
- Model selection

#### 2. Components

**Sidebar.jsx**
- Navigation menu
- User info
- Logout

**PrivateRoute.jsx**
- Authentication guard
- Redirects to login if unauthenticated

**ConnectionModal.jsx**
- Connection form
- Connection testing

**QueryModal.jsx**
- Query editor (Monaco/Ace)
- Execution and save

#### 3. API Client (axios.js)

Configured Axios instance with:
- Base URL from environment
- JWT token injection (interceptor)
- 401 handling (auto-logout)

```javascript
// Token stored in localStorage as 'mongo-token'
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('mongo-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Database Schema

### SQLite Database (ApplicationDbContext)

#### MongoConnection Table

```csharp
public class MongoConnection
{
    public int Id { get; set; }
    public string UserId { get; set; }           // FK to User
    public string Name { get; set; }             // Display name
    public string ConnectionString { get; set; }  // MongoDB URI
    public string DatabaseName { get; set; }      // Target database
    public bool IsProfilingActive { get; set; }   // Profiling state
    public string ConnectionStatus { get; set; }  // Last test status
    public DateTime? LastTestedAt { get; set; }
}
```

#### Query Table

```csharp
public class Query
{
    public int Id { get; set; }
    public string UserId { get; set; }           // FK to User
    public int ConnectionId { get; set; }        // FK to MongoConnection
    public string Title { get; set; }
    public string Description { get; set; }
    public string QueryText { get; set; }        // JSON aggregation pipeline
    public string CollectionName { get; set; }   // Target collection
    public DateTime CreatedAt { get; set; }
    public DateTime? LastRun { get; set; }
    public int RunCount { get; set; }
    public bool IsFavourite { get; set; }

    // Navigation
    public MongoConnection Connection { get; set; }
    public List<QueryLog> QueryLogs { get; set; }
}
```

#### QueryLog Table

```csharp
public class QueryLog
{
    public int Id { get; set; }
    public int QueryId { get; set; }             // FK to Query
    public DateTime RunAt { get; set; }
    public string RunBy { get; set; }            // User email
    public long Duration { get; set; }           // Milliseconds
    public string QueryText { get; set; }        // Executed query
    public string UserId { get; set; }           // FK to User

    // Navigation
    public Query Query { get; set; }
}
```

#### User Table

```csharp
public class User
{
    public string Id { get; set; }               // GUID
    public string Email { get; set; }            // Unique
    public string Password { get; set; }         // BCrypt hashed
    public DateTime CreatedAt { get; set; }
}
```

#### AIProviderSettings Table

```csharp
public class AIProviderSettings
{
    public int Id { get; set; }
    public string UserId { get; set; }           // FK to User
    public string Provider { get; set; }         // "OpenAI", "OpenRouter", "Anthropic"
    public string ApiKey { get; set; }           // Encrypted/plain API key
    public string Model { get; set; }            // Model name
    public string ApiUrl { get; set; }           // Custom endpoint (optional)
    public string AdditionalSettings { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### MongoDB Collections (User Databases)

**system.profile** (created automatically when profiling is enabled)
- Stores profiled query information
- Used by QueryProfilerService
- Fields: op, ns, command, millis, ts, etc.

---

## API Endpoints

### Complete API Reference

#### Authentication

```
POST   /api/Auth/login              # Login user, returns JWT
POST   /api/Auth/register           # Register new user
```

**Request Body (Login)**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "email": "user@example.com"
}
```

#### MongoDB Connections

```
GET    /api/MongoConnection                              # List all (paginated)
GET    /api/MongoConnection/{id}                         # Get by ID
POST   /api/MongoConnection                              # Create
PUT    /api/MongoConnection/{id}                         # Update
DELETE /api/MongoConnection/{id}                         # Delete
POST   /api/MongoConnection/test                         # Test connection
GET    /api/MongoConnection/{id}/collections             # List collections
GET    /api/MongoConnection/{id}/collections/{name}/fields  # Get schema
```

**Example Request (Create Connection)**:
```json
{
  "name": "Production MongoDB",
  "connectionString": "mongodb://localhost:27017",
  "databaseName": "mydb"
}
```

#### Queries

```
GET    /api/Query                      # List all (paginated, filterable)
GET    /api/Query/favorites            # Get favorites
GET    /api/Query/{id}                 # Get by ID
POST   /api/Query                      # Create
PUT    /api/Query/{id}                 # Update
DELETE /api/Query/{id}                 # Delete
POST   /api/Query/{id}/execute         # Execute query
POST   /api/Query/{id}/format          # Format JSON
GET    /api/Query/{id}/download/csv    # Export CSV
GET    /api/Query/{id}/download-json   # Export JSON
POST   /api/Query/{id}/favourite       # Toggle favorite
```

**Example Request (Create Query)**:
```json
{
  "connectionId": 1,
  "title": "Active Users",
  "description": "Find all active users",
  "collectionName": "users",
  "queryText": "[{\"$match\": {\"status\": \"active\"}}]"
}
```

**Example Request (Execute Query)**:
```json
{
  "limit": 100,
  "skip": 0
}
```

#### AI Query Generator

```
POST   /api/AIQueryGenerator/generate  # Generate MongoDB query from natural language
```

**Example Request**:
```json
{
  "connectionId": 1,
  "collectionName": "users",
  "naturalLanguageQuery": "Find all users who registered in the last 30 days",
  "sampleDocuments": "[{\"name\": \"John\", \"registeredAt\": \"2024-01-01\"}]"
}
```

**Example Response**:
```json
{
  "queryText": "[{\"$match\": {\"registeredAt\": {\"$gte\": {\"$date\": \"2024-10-19\"}}}}]",
  "explanation": "This query filters users by registration date..."
}
```

#### Query Profiler

```
GET    /api/QueryProfiler/profiled-queries/{connectionId}                    # Get all profiled
GET    /api/QueryProfiler/profiled-queries/{connectionId}/{collectionName}  # Get by collection
POST   /api/QueryProfiler/start-profiling/{connectionId}                    # Start profiling
POST   /api/QueryProfiler/stop-profiling/{connectionId}                     # Stop profiling
POST   /api/QueryProfiler/suggest-indexes                                   # AI index suggestions
POST   /api/QueryProfiler/create-index                                      # Create index
POST   /api/QueryProfiler/create-indexes-for-query-log                      # Bulk create
```

**Example Request (Suggest Indexes)**:
```json
{
  "connectionId": 1,
  "collectionName": "users",
  "queryLog": "{\"find\": \"users\", \"filter\": {\"status\": \"active\"}}"
}
```

#### Query Logs

```
GET    /api/QueryLog                   # List all (paginated)
GET    /api/QueryLog/{queryId}/logs    # Get logs for specific query
```

#### AI Provider Settings

```
GET    /api/AIProviderSettings             # Get current settings
POST   /api/AIProviderSettings             # Create/update settings
GET    /api/AIProviderSettings/available-models  # Get models for provider
```

**Example Request**:
```json
{
  "provider": "OpenAI",
  "apiKey": "sk-...",
  "model": "gpt-4",
  "apiUrl": null,
  "additionalSettings": null
}
```

#### SignalR Hub

**Endpoint**: `/queryProfilerHub`

**Methods**:
- `SubscribeToConnection(connectionId)` - Subscribe to profiling updates
- `UnsubscribeFromConnection(connectionId)` - Unsubscribe

**Events Received**:
- `ReceiveProfiledQuery` - New profiled query data

---

## Frontend Structure

### Routing Configuration

```javascript
// App.jsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Protected routes */}
    <Route path="/" element={<PrivateRoute><ConnectionManager /></PrivateRoute>} />
    <Route path="/queries" element={<PrivateRoute><QueryManager /></PrivateRoute>} />
    <Route path="/ai-query-generator" element={<PrivateRoute><AIQueryGenerator /></PrivateRoute>} />
    <Route path="/query-logs" element={<PrivateRoute><QueryLogs /></PrivateRoute>} />
    <Route path="/query-profiler" element={<PrivateRoute><QueryProfiler /></PrivateRoute>} />
    <Route path="/openai-settings" element={<PrivateRoute><OpenAISettings /></PrivateRoute>} />
  </Routes>
</BrowserRouter>
```

### State Management

**No global state library** - Uses React hooks and local state:
- `useState` - Component state
- `useEffect` - Side effects and data fetching
- `useNavigate` - Routing
- `localStorage` - JWT token persistence

### Authentication Flow

1. User logs in → JWT token returned
2. Token stored in `localStorage` as `'mongo-token'`
3. Axios interceptor adds token to all requests
4. `PrivateRoute` checks token presence
5. 401 responses trigger auto-logout and redirect to `/login`

### Monaco Editor Integration

**config-overrides.js** configures Monaco Editor webpack plugin:

```javascript
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = function override(config) {
  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: ['json', 'javascript']
    })
  );
  return config;
};
```

Used in:
- Query editor
- AI query generator
- JSON formatting

---

## Coding Conventions

### Backend (C#)

#### Naming Conventions

- **Controllers**: PascalCase, suffix with `Controller`
  - Example: `MongoConnectionController.cs`
- **Services**: PascalCase, suffix with `Service`
  - Example: `OpenAIService.cs`
- **Models**: PascalCase
  - Example: `MongoConnection.cs`
- **Methods**: PascalCase
  - Example: `GetConnections()`, `CreateQuery()`
- **Private fields**: camelCase with underscore prefix
  - Example: `_context`, `_logger`
- **Properties**: PascalCase
  - Example: `ConnectionString`, `QueryText`

#### API Response Patterns

**Success Response**:
```csharp
return Ok(data);                    // 200
return Ok(new { message = "..." }); // 200 with message
return Created($"/api/resource/{id}", resource); // 201
```

**Error Response**:
```csharp
return BadRequest("Error message");           // 400
return NotFound("Resource not found");        // 404
return Unauthorized("Not authorized");        // 401
```

#### Dependency Injection

Register services in `Program.cs`:

```csharp
builder.Services.AddScoped<IOpenAIService, OpenAIService>();
builder.Services.AddSingleton<AIProviderFactory>();
builder.Services.AddHostedService<QueryProfilerService>();
```

Inject in controllers:

```csharp
private readonly ApplicationDbContext _context;
private readonly ILogger<QueryController> _logger;

public QueryController(ApplicationDbContext context, ILogger<QueryController> logger)
{
    _context = context;
    _logger = logger;
}
```

#### Async/Await Pattern

Always use async for I/O operations:

```csharp
[HttpGet]
public async Task<IActionResult> GetConnections()
{
    var connections = await _context.MongoConnections
        .Where(c => c.UserId == userId)
        .ToListAsync();
    return Ok(connections);
}
```

### Frontend (JavaScript/React)

#### Naming Conventions

- **Components**: PascalCase
  - Example: `ConnectionManager.jsx`, `QueryModal.jsx`
- **Functions**: camelCase
  - Example: `fetchConnections()`, `handleSubmit()`
- **Constants**: UPPER_SNAKE_CASE
  - Example: `API_BASE_URL`
- **Props**: camelCase
  - Example: `onClose`, `isOpen`, `connectionId`

#### Component Structure

```javascript
// 1. Imports
import { useState, useEffect } from 'react';
import { Box, Button } from '@chakra-ui/react';

// 2. Component definition
function MyComponent({ prop1, prop2 }) {
  // 3. State hooks
  const [data, setData] = useState([]);

  // 4. Effect hooks
  useEffect(() => {
    fetchData();
  }, []);

  // 5. Functions
  const fetchData = async () => {
    // ...
  };

  // 6. Render
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
}

// 7. Export
export default MyComponent;
```

#### API Calls

Use Axios instance from `api/axios.js`:

```javascript
import axiosInstance from '../api/axios';

const fetchConnections = async () => {
  try {
    const response = await axiosInstance.get('/MongoConnection');
    setConnections(response.data);
  } catch (error) {
    console.error('Error fetching connections:', error);
    // Handle error (toast, alert, etc.)
  }
};
```

#### Error Handling

```javascript
try {
  const response = await axiosInstance.post('/Query', queryData);
  // Success handling
  toast({
    title: 'Success',
    status: 'success',
    duration: 3000
  });
} catch (error) {
  // Error handling
  toast({
    title: 'Error',
    description: error.response?.data || 'An error occurred',
    status: 'error',
    duration: 5000
  });
}
```

#### Chakra UI Usage

Prefer Chakra UI components over raw HTML:

```javascript
// Good
<Box bg="gray.100" p={4} borderRadius="md">
  <Heading size="md">Title</Heading>
  <Button colorScheme="blue" onClick={handleClick}>
    Click Me
  </Button>
</Box>

// Avoid
<div style={{ background: '#f7f7f7', padding: '1rem' }}>
  <h3>Title</h3>
  <button onClick={handleClick}>Click Me</button>
</div>
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Create/Update Controller** (`backend/Controllers/`)

```csharp
[HttpGet("my-endpoint")]
public async Task<IActionResult> MyEndpoint()
{
    // Implementation
    return Ok(result);
}
```

2. **Update Frontend API Client**

```javascript
// In relevant page/component
const callEndpoint = async () => {
  const response = await axiosInstance.get('/Controller/my-endpoint');
  return response.data;
};
```

3. **Test** endpoint using Swagger UI at http://localhost:7073/swagger

### Adding a New Database Entity

1. **Create Model** (`backend/Models/`)

```csharp
public class MyEntity
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string UserId { get; set; }
}
```

2. **Update DbContext** (`backend/ApplicationDbContext.cs`)

```csharp
public DbSet<MyEntity> MyEntities { get; set; }
```

3. **Create Migration**

```bash
cd backend
dotnet ef migrations add AddMyEntity
dotnet ef database update
```

4. **Create Controller** for CRUD operations

### Adding a New Page

1. **Create Page Component** (`frontend/src/pages/MyPage.jsx`)

```javascript
import { Box, Heading } from '@chakra-ui/react';

function MyPage() {
  return (
    <Box p={6}>
      <Heading>My Page</Heading>
      {/* Content */}
    </Box>
  );
}

export default MyPage;
```

2. **Add Route** (`frontend/src/App.jsx`)

```javascript
<Route path="/my-page" element={
  <PrivateRoute><MyPage /></PrivateRoute>
} />
```

3. **Add Navigation Link** (`frontend/src/components/Sidebar.jsx`)

```javascript
<Link to="/my-page">My Page</Link>
```

### Adding AI Provider Support

1. **Create Service** (`backend/Services/MyAIProviderService.cs`)

```csharp
public class MyAIProviderService : IOpenAIService
{
    public async Task<string> GenerateQueryAsync(string prompt, string schema)
    {
        // Implementation
    }
}
```

2. **Update Factory** (`backend/Services/AIProviderFactory.cs`)

```csharp
public IOpenAIService CreateProvider(AIProviderSettings settings)
{
    return settings.Provider switch
    {
        "MyProvider" => new MyAIProviderService(settings),
        // ... other providers
    };
}
```

3. **Update Frontend Settings** (`frontend/src/pages/OpenAISettings.jsx`)

Add provider option to dropdown

### Modifying Query Execution

**Backend**: `QueryController.cs` → `Execute()` method

```csharp
[HttpPost("{id}/execute")]
public async Task<IActionResult> Execute(int id, [FromBody] ExecuteQueryDto dto)
{
    // MongoDB aggregation execution
    var pipeline = BsonSerializer.Deserialize<BsonDocument[]>(query.QueryText);
    var cursor = collection.Aggregate<BsonDocument>(pipeline);
    var results = await cursor.ToListAsync();

    // Log execution
    // Return results
}
```

**Frontend**: `QueryManager.jsx` → `executeQuery()` function

### Working with MongoDB Profiling

**Start Profiling**:
```csharp
// QueryProfilerController.cs
db.SetProfilingLevel(ProfilingLevel.All);
```

**Background Service**: `QueryProfilerService.cs`
- Runs continuously
- Polls `system.profile` collection
- Streams to SignalR hub

**Frontend Listener**: `QueryProfiler.jsx`
```javascript
connection.on('ReceiveProfiledQuery', (query) => {
  setProfiledQueries(prev => [...prev, query]);
});
```

---

## Testing

### Backend Testing

**Current State**: No dedicated test project exists.

**Recommended Setup**:
```bash
cd backend
dotnet new xunit -n Backend.Tests
dotnet add Backend.Tests reference Backend
```

**Test Structure** (if implementing):
```
backend.Tests/
├── Controllers/
│   ├── QueryControllerTests.cs
│   └── MongoConnectionControllerTests.cs
├── Services/
│   └── OpenAIServiceTests.cs
└── Integration/
    └── ApiIntegrationTests.cs
```

### Frontend Testing

**Configured**: Jest + React Testing Library

**Run Tests**:
```bash
cd frontend
npm test
```

**Test Structure** (if implementing):
```
frontend/src/
├── pages/
│   └── ConnectionManager.test.jsx
└── components/
    └── QueryModal.test.jsx
```

**Example Test**:
```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  const element = screen.getByText(/expected text/i);
  expect(element).toBeInTheDocument();
});
```

### Manual Testing

**Swagger UI**: http://localhost:7073/swagger
- Test all API endpoints
- View request/response schemas
- Execute requests directly

**Browser DevTools**:
- Network tab for API calls
- Console for errors
- React DevTools for component inspection

---

## Deployment

### Docker Deployment

**Production Build**:
```bash
docker-compose up -d --build
```

**Environment Variables** (docker-compose.yml):
- `ASPNETCORE_ENVIRONMENT`
- `AllowedOrigins`
- `REACT_APP_API_URL`

### Render.com Deployment (Current Production)

**Live URL**: https://mongo-explorer.onrender.com/

**Backend**:
- Web Service
- Build Command: `dotnet build`
- Start Command: `dotnet run`

**Frontend**:
- Static Site
- Build Command: `npm run build`
- Publish Directory: `build`

### Database Persistence

**SQLite**: Stored in `backend/app.db`
- Ensure volume mount in production:
  ```yaml
  volumes:
    - ./backend/app.db:/app/app.db
  ```

**MongoDB**: External - users provide connection strings

---

## Important Notes

### Security Considerations

1. **JWT Tokens**:
   - Stored in localStorage (vulnerable to XSS)
   - Consider httpOnly cookies for production
   - Token expiration configured in `appsettings.json`

2. **API Keys**:
   - AI provider keys stored in database
   - Consider encryption at rest
   - Never commit keys to version control

3. **MongoDB Connections**:
   - Connection strings stored in plaintext
   - SSL/TLS validation disabled (`SslSettings.CheckCertificateRevocation = false`)
   - OK for development, review for production

4. **CORS**:
   - Configure `AllowedOrigins` in environment variables
   - Avoid `AllowAnyOrigin()` in production

5. **Password Hashing**:
   - Uses BCrypt with default work factor
   - Never store plaintext passwords

### Performance Considerations

1. **Query Limits**:
   - Default limit: 100 documents
   - Configurable in execute request
   - Consider pagination for large results

2. **Profiling Overhead**:
   - MongoDB profiling impacts performance
   - Disable when not actively monitoring
   - `system.profile` collection grows indefinitely (consider TTL)

3. **SignalR Connections**:
   - One connection per active profiler page
   - Ensure cleanup on component unmount

4. **Database Migrations**:
   - Automatic migrations on startup (`Program.cs`)
   - Backup database before schema changes

### Known Limitations

1. **ESLint Rules Disabled**:
   - `react-hooks/exhaustive-deps`: disabled
   - `no-unused-vars`: disabled
   - Consider re-enabling and fixing warnings

2. **No Test Coverage**:
   - Backend has no unit tests
   - Frontend has test setup but no tests
   - Manual testing via Swagger and browser

3. **Single User Context**:
   - Multi-tenancy via `UserId`
   - No role-based access control
   - All users have same permissions

4. **MongoDB Write Operations**:
   - Currently read-only queries
   - Index creation supported
   - No document insert/update/delete UI

### Environment-Specific Notes

**Development**:
- Hot reload enabled (React + .NET)
- Verbose logging
- Swagger UI available

**Production**:
- Minified frontend build
- Reduced logging
- HTTPS recommended
- Configure reverse proxy (nginx) for SSL termination

---

## Quick Reference

### Useful Commands

```bash
# Backend
cd backend
dotnet restore              # Install dependencies
dotnet build                # Build project
dotnet run                  # Run development server
dotnet ef migrations add X  # Create migration
dotnet ef database update   # Apply migrations

# Frontend
cd frontend
npm install                 # Install dependencies
npm start                   # Development server
npm run build               # Production build
npm test                    # Run tests

# Docker
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
docker-compose build        # Rebuild images

# Git
git status                  # Check status
git add .                   # Stage all
git commit -m "message"     # Commit
git push -u origin claude/[branch-name]  # Push to feature branch
```

### Important File Locations

| Purpose | File Path |
|---------|-----------|
| Backend entry point | `/backend/Program.cs` |
| Backend configuration | `/backend/appsettings.json` |
| Database context | `/backend/ApplicationDbContext.cs` (implied) |
| Frontend entry point | `/frontend/src/index.jsx` |
| App component | `/frontend/src/App.jsx` |
| Axios config | `/frontend/src/api/axios.js` |
| Docker compose | `/docker-compose.yml` |
| Frontend Dockerfile | `/frontend/Dockerfile` |
| Backend Dockerfile | `/backend/Dockerfile` |

### Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 7072 | http://localhost:7072 |
| Backend API | 7073 | http://localhost:7073 |
| Swagger UI | 7073 | http://localhost:7073/swagger |
| SignalR Hub | 7073 | http://localhost:7073/queryProfilerHub |

---

## Getting Help

### Documentation Resources

- **ASP.NET Core**: https://docs.microsoft.com/en-us/aspnet/core/
- **React**: https://react.dev/
- **Chakra UI**: https://chakra-ui.com/
- **MongoDB Driver**: https://mongodb.github.io/mongo-csharp-driver/
- **Entity Framework Core**: https://docs.microsoft.com/en-us/ef/core/
- **SignalR**: https://docs.microsoft.com/en-us/aspnet/core/signalr/

### Common Issues

**Backend won't start**:
- Check .NET 8 SDK installed: `dotnet --version`
- Restore packages: `dotnet restore`
- Check port 7073 not in use

**Frontend won't start**:
- Check Node.js version: `node --version` (18+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check port 7072 not in use

**Authentication failing**:
- Check JWT secret in `appsettings.json`
- Verify token in localStorage: `localStorage.getItem('mongo-token')`
- Check token expiration

**MongoDB connection issues**:
- Test connection via Swagger UI first
- Verify connection string format
- Check network access to MongoDB instance
- Ensure database exists

**AI features not working**:
- Configure AI provider in OpenAI Settings
- Verify API key is valid
- Check API endpoint (for custom providers)
- Review backend logs for API errors

---

## Contributing Guidelines

### Branch Naming

- Feature branches: `claude/claude-md-[session-id]`
- Always push to Claude-specific branches
- Never push directly to `main` or `master`

### Commit Messages

Follow conventional commits:
```
feat: Add new query export feature
fix: Resolve connection timeout issue
docs: Update API documentation
refactor: Simplify query execution logic
test: Add unit tests for QueryController
```

### Pull Request Process

1. Ensure all changes are committed
2. Push to feature branch: `git push -u origin claude/[branch-name]`
3. Create PR with description:
   - Summary of changes
   - Test plan
   - Screenshots (if UI changes)
4. Request review

### Code Quality

**Before Committing**:
- Build succeeds (`dotnet build` / `npm run build`)
- No console errors in browser
- Test affected functionality
- Format code consistently
- Remove debug statements

---

## Changelog

### Recent Changes (from git log)

- **95be4bd**: ffixes
- **9eace8f**: fixes
- **6632d57**: fix modals
- **eb487cf**: fixes
- **1d393c5**: fixes

### Version History

**Current Version**: Development (pre-v1.0)

**Features**:
- Multi-instance MongoDB management
- AI-powered query generation
- Real-time query profiling
- Index suggestions and creation
- Query history and favorites
- CSV/JSON export

---

**End of CLAUDE.md**

*This document is maintained for AI assistants working on the MongoDB Explorer codebase. Keep it updated as the project evolves.*
