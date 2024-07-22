# Use the SDK image for both build and runtime
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY ["Backend.csproj", "./"]
RUN dotnet restore "Backend.csproj"

# Copy the rest of the code
COPY . .

# Build the application
RUN dotnet build "Backend.csproj" -c Release -o /app/build

# Install EF Core tools
RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

# Publish the application
RUN dotnet publish "Backend.csproj" -c Release -o /app/publish

# Set environment variables
ENV ASPNETCORE_URLS=http://+:7073
ENV ALLOWED_ORIGINS=http://localhost:7072
ENV USE_HTTPS=false

# Expose the port the app will run on
EXPOSE 7073

# Create a directory for the SQLite database
RUN mkdir -p /app/data

# Set the connection string to use the correct path
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/MongoConnectionManager.db"

# Create an entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Apply database migrations\n\
dotnet ef database update\n\
\n\
# Start the application\n\
exec dotnet /app/publish/Backend.dll' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]