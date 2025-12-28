FROM node:25.2.0-alpine

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
ENV TARGET_DATE=2025-01-01T00:00:00
ENV VIDEO_FILENAME=somevideo.mp4
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose port
EXPOSE ${PORT}

# Create a startup script to inject environment variables and start the server
RUN echo '#!/bin/sh' > ./start.sh && \
    echo 'sed -i "s|TARGET_DATE_PLACEHOLDER|$TARGET_DATE|g" ./public/build/bundle.js' >> ./start.sh && \
    echo 'sed -i "s|VIDEO_FILENAME_PLACEHOLDER|$VIDEO_FILENAME|g" ./public/build/bundle.js' >> ./start.sh && \
    echo 'npx sirv public --host "$HOST" --port "$PORT" --no-cors' >> ./start.sh && \
    chmod +x ./start.sh

# Start the application
CMD ["./start.sh"]
