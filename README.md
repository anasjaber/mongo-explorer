# 🚀 Mongo Explorer

Mongo Explorer is a comprehensive web-based application for exploring, managing, and optimizing MongoDB databases. It provides a powerful and user-friendly interface for performing a wide range of MongoDB operations, from basic querying to advanced performance optimization.

## Live Demo

https://mongo-explorer.onrender.com/

## ✨ Features

- 🔌 Connect to multiple MongoDB instances
- 🗂️ Browse databases and collections
- 🔍 Execute and save MongoDB queries
- 📊 Analyze query performance
- 🤖 AI-assisted query generation and optimization
- 🗃️ User-friendly interface for managing indexes
- 📝 Browse schemas for collections and queries
- ⭐ Save and manage favorite queries
- 💾 Download query execution results as JSON
- 📈 Manage and analyze query logs
- 🧠 OpenAI support for advanced features
- 💡 AI-powered index suggestions with one-click creation
- 🔬 Profile and enhance queries directly from the database
- 🎉 And much more!

## 🏗️ Project Structure

The project consists of two main components:

1. Frontend: A React-based web application
2. Backend: An ASP.NET Core 8 API

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- 🐳 Docker
- 🐙 Docker Compose

## 📸 Screenshots

Here are some screenshots of the Mongo Explorer application to give you a glimpse of its features:

### Connection Manager
![Connection Manager](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/connection-manager.png)
Manage your MongoDB connections with ease. Add new connections, edit existing ones, test connections, view schemas, and delete connections as needed.

### Queries
![Queries Management](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/queries.png)
The Add New Query interface provides a user-friendly way to create, save, and manage your MongoDB queries. You can also generate queries using AI assistance/Execute queries/Display schemas.

### Edit Query
![Edit Query](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/edit-query.png)
Easily edit your MongoDB queries with a user-friendly interface. You can update query details, modify the query text, and even generate new queries using AI assistance.

### AI Query Generator
![AI Query Generator](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/ai-query-generator.png)
The AI Query Generator allows you to create MongoDB queries using natural language. Simply describe what you want to query, and the AI will generate the appropriate MongoDB query for you.

### Query Logs
![Query Logs](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/query-logs.png)
The Query Logs feature keeps track of all the queries you've run, allowing you to easily review and reuse your previous work.

### Query Profiler
![Query Profiler](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/query-profiler.png)
The Query Profiler helps you analyze and optimize your MongoDB queries. It provides detailed information about query execution time and allows you to identify performance bottlenecks.

### Suggested Indexes for Query
![Suggested Indexes for Query](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/suggested-indexes.png)
Mongo Explorer provides AI-powered index suggestions to optimize your queries. You can create these indexes with just one click.

### OpenAI Settings
![OpenAI Settings](https://github.com/anasjaber/mongo-explorer/blob/main/screenshots/openai-settings.png)
Configure your OpenAI settings to enable AI-powered features. Set your API key and choose the AI model that best suits your needs.

## 🚀 Getting Started

To run Mongo Explorer on your local machine, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/anasjaber/mongo-explorer.git
   cd mongo-explorer
   ```

2. Start the application using Docker Compose:
   ```
   docker-compose up -d --build
   ```

3. Once the containers are up and running, you can access the application:
   - 🖥️ Frontend: http://localhost:7072
   - ⚙️ Backend API: http://localhost:7073/docs

That's it! 🎈 With just these simple steps, you'll have the entire Mongo Explorer application up and running, ready to connect to your MongoDB instances and start exploring.

## ⚙️ Configuration

You can configure the application by modifying the `docker-compose.yml` file, which contains environment variables for both frontend and backend services.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License.

## 🎉 Enjoy Exploring!

We hope you find Mongo Explorer helpful in your MongoDB journey. Happy exploring! 🔍🗃️
