# Build stage
FROM node:18 as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package.json yarn.lock* ./

# Install project dependencies
RUN yarn install --frozen-lockfile

# Copy the entire project directory
COPY . .

# Build the React app for production using react-app-rewired
RUN yarn run react-app-rewired build

# Production stage
FROM nginx:stable-alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 7072
EXPOSE 7072

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]