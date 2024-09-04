# Mongo Explorer

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://mongo-explorer.onrender.com/)

## Getting Started

Follow these steps to run Mongo Explorer locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anasjaber/mongo-explorer.git
   cd mongo-explorer
   ```

2. **Launch with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application:**
   - Frontend: [http://localhost:7072](http://localhost:7072)
   - Backend API: [http://localhost:7073/docs](http://localhost:7073/docs)

That's it! You're ready to explore MongoDB with ease!

## About

Mongo Explorer is a powerful web-based application for exploring, managing, and optimizing MongoDB databases. It offers a user-friendly interface for a wide range of MongoDB operations, from basic querying to advanced performance optimization.

## Key Features

- Multi-instance MongoDB connections
- Database and collection browsing
- Query execution and management
- Performance analysis
- AI-assisted query generation and optimization
- Index management interface
- Schema browsing for collections and queries
- Favorite query management
- JSON export of query results
- Query log analysis
- OpenAI integration for advanced features
- AI-powered index suggestions with one-click creation
- In-database query profiling and enhancement

## Project Architecture

The project consists of two main components:

1. **Frontend**: React-based web application
2. **Backend**: ASP.NET Core 8 API

## Screenshots

### Connection Manager
![Connection Manager](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/connection-manager.png)
Effortlessly manage your MongoDB connections. Add, edit, test, and delete connections with ease.

### Queries Management
![Queries Management](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/queries.png)
Create, save, and manage your MongoDB queries with our intuitive interface. Generate queries using AI assistance, execute them, and view schemas.

### Edit Query
![Edit Query](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/edit-query.png)
Seamlessly edit your MongoDB queries, update details, and generate new queries with AI assistance.

### AI Query Generator
![AI Query Generator](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/ai-query-generator.png)
Create MongoDB queries using natural language. Let AI transform your descriptions into powerful MongoDB queries.

### Query Logs
![Query Logs](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/query-logs.png)
Keep track of your query history for easy review and reuse.

### Query Profiler
![Query Profiler](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/query-profiler.png)
Analyze and optimize your MongoDB queries with detailed execution insights.

### Suggested Indexes
![Suggested Indexes for Query](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/suggested-indexes.png)
Get AI-powered index suggestions to optimize your queries, with one-click creation.

### OpenAI Settings
![OpenAI Settings](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/openai-settings.png)
Configure your OpenAI integration to unlock AI-powered features.

## Configuration

Customize the application by modifying the `docker-compose.yml` file, which contains environment variables for both frontend and backend services.

## Contributing

We welcome contributions! Feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Happy Exploring!

We hope Mongo Explorer enhances your MongoDB experience. Dive in and start exploring!
