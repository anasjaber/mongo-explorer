# 🚀 Mongo Explorer

Mongo Explorer is a comprehensive web-based application for exploring, managing, and optimizing MongoDB databases. It provides a powerful and user-friendly interface for performing a wide range of MongoDB operations, from basic querying to advanced performance optimization.

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

## 🚀 Getting Started

To run Mongo Explorer on your local machine, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/anasjaber/mongo-explorer.git
   cd mongo-explorer
   ```

2. Set up environment variables:
   - Open the `docker-compose.yml` file
   - Find the `backend` service section
   - Add or modify the following environment variables:
     ```yaml
     environment:
       - OPENAI_KEY=your_openai_api_key_here
       - OPENAI_MODEL=gpt-4o  # or your preferred model
     ```

3. Start the application using Docker Compose:
   ```
   docker-compose up --build
   ```

4. Once the containers are up and running, you can access the application:
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
