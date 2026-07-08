FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the application source code
COPY . .

# Ensure the uploads directory exists and is owned by the node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
