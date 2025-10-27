# Countdown Timer App

A beautiful Svelte countdown timer that displays days, hours, minutes, and seconds until a target date.

## Features

- Real-time countdown display
- Responsive design
- Configurable target date via environment variable
- Docker support
- Modern gradient UI

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:8000`

## Building for Production

```bash
npm run build
```

## Docker Usage

### Build the Docker image:
```bash
docker build -t countdown-app .
```

### Run with default date (New Year 2025):
```bash
docker run -p 8000:8000 countdown-app
```

### Run with custom target date:
```bash
docker run -p 8000:8000 -e TARGET_DATE="2024-12-25T00:00:00" countdown-app
```

### Run with custom port:
```bash
docker run -p 8080:8080 -e PORT=8080 countdown-app
```

### Run with both custom date and port:
```bash
docker run -p 3000:3000 -e TARGET_DATE="2024-12-25T00:00:00" -e PORT=3000 countdown-app
```

## Environment Variables

### TARGET_DATE
The target date for the countdown timer. Should be in ISO 8601 format:
- `YYYY-MM-DDTHH:mm:ss` (e.g., `2024-12-25T00:00:00`)
- `YYYY-MM-DD` (e.g., `2024-12-25`)
- Default: `2025-01-01T00:00:00`

### PORT
The port number for the web server to listen on:
- Default: `8000`
- Example: `8080`, `3000`, `80`

## Examples

- New Year: `2025-01-01T00:00:00`
- Christmas: `2024-12-25T00:00:00`
- Birthday: `2024-06-15T12:00:00`
- Wedding: `2024-08-10T14:30:00`

## Technology Stack

- Svelte 3
- Rollup (bundler)
- Node.js
- Docker
