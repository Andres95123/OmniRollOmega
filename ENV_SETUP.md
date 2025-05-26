# Environment Variables Setup

## Configuration

This project uses environment variables to manage sensitive configuration like server URLs.

### Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace `your_server_url_here` with your actual server URL:
   ```
   VITE_SERVER_URL=https://your-actual-server.com
   ```

### Available Environment Variables

- `VITE_SERVER_URL`: The base URL for the API server
  - Production: `https://your-production-server.com`
  - Development: `http://localhost:8000`

### Important Notes

- Never commit the `.env` file to the repository
- The `.env.example` file should be committed as a template
- Environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend code
