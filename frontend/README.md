# Frontend

React + Vite frontend for the Music Marketplace project.

## Local development

```bash
npm install
copy .env.example .env
npm run dev
```

Default local URL: `http://localhost:5173`

## Environment variables

- `VITE_API_BASE_URL`
  - Base URL for the FastAPI backend
  - Local example: `http://localhost:8000`

## Deployment

This frontend is configured for:

- Docker-based local development through the root `docker-compose.yml`
- Render Static Site deployment through the root `render.yaml`
