# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start Development Server**: `npm run dev` (Runs server with hot-reload via `--watch`)
- **Start Production Server**: `npm start`
- **Build Frontend**: `npm run build` (Copies `public/` to `dist/` for production)
- **Docker Build**: `docker build -t api-tester .`
- **Docker Compose**: `docker-compose up -d`

## Architecture & Structure

This is a lightweight, zero-dependency (except Express and Dotenv) web UI for testing and debugging AI APIs.

### Backend (`server.js`)
- Acts as a proxy to bypass browser CORS restrictions.
- Handles requests to `/api/models` and `/api/test`.
- Translates a unified request format into provider-specific formats (OpenAI, Anthropic, Gemini, Custom).
- Serves static files from `public/` in development and `dist/` in production.
- Uses native Node.js `fetch` (requires Node 18+).

### Frontend (`public/`)
- **`index.html`**: The main UI structure. Uses a "Neon Cyber-Utilitarian" aesthetic (dark mode, high contrast, monospace fonts).
- **`style.css`**: Contains all styling, including responsive design for mobile and custom CSS variables for theming.
- **`app.js`**: Handles UI logic, local storage for saving configurations, multi-language support (i18n), and API requests to the backend proxy.

### Key Design Patterns
- **Configuration Storage**: User configurations (API keys, URLs) are stored entirely client-side in `localStorage`.
- **Provider Abstraction**: The backend `API_CONFIGS` object maps generic request parameters to provider-specific endpoints and headers.
- **Fallback Fetching**: The `fetchWithFallback` function in `server.js` attempts to append `/v1` to URLs if the initial request returns a 404, improving compatibility with various OpenAI-compatible endpoints.