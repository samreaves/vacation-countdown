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

# Expose port
EXPOSE 5000

# Set default environment variable for target date
# Format: YYYY-MM-DDTHH:mm:ss (ISO 8601)
ENV TARGET_DATE=2025-01-01T00:00:00

# Create a script to inject the environment variable into the built app
RUN echo "#!/bin/sh" > /app/start.sh && \
    echo "sed -i \"s|TARGET_DATE_PLACEHOLDER|\$TARGET_DATE|g\" /app/public/build/bundle.js" >> /app/start.sh && \
    echo "npm run start -- --port 5000" >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
