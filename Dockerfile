# Use Node.js 18 alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install a simple HTTP server for serving static files
RUN npm install -g serve

# Expose port 8080
EXPOSE 8080

# Command to run the application
CMD ["serve", "-s", "dist", "-l", "8080"] 