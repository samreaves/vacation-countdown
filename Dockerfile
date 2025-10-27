# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set default environment variables
# Format: YYYY-MM-DDTHH:mm:ss (ISO 8601)
ENV TARGET_DATE=2025-01-01T00:00:00
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose port (using default, but can be overridden)
EXPOSE $PORT

# Create a script to inject the environment variables into the built app
RUN echo "#!/bin/sh" > /app/start.sh && \
    echo "sed -i \"s|TARGET_DATE_PLACEHOLDER|\$TARGET_DATE|g\" /app/public/build/bundle.js" >> /app/start.sh && \
    echo "npm run start -- --host \$HOST--port \$PORT" >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
