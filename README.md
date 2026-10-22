# Placement Portal Backend

## Local setup

1. Install a local MongoDB server or create a MongoDB Atlas database.
2. Install Ollama, then download the local chatbot model with `ollama pull qwen2.5:3b`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and a private `JWT_SECRET`.
4. Run `npm install`, then `npm run dev` from this directory. The chatbot uses Ollama by default and needs no provider API key.
5. To use OpenAI instead, set `AI_PROVIDER=openai` and provide a valid `OPENAI_API_KEY`.
6. In `Placement-Frontend`, copy `.env.example` to `.env`, run `npm install`, and start Vite with `npm run dev`.

For password reset emails, configure the `SMTP_*` values. Without SMTP, the backend returns a development reset link; this fallback is disabled in production.

## API routes

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`
- `POST /api/chat` and `GET /api/chat/history/:conversationId` (Bearer token)
- `GET /api/practice/progress`, `POST /api/practice/aptitude/attempts`, and `PUT /api/practice/coding` (Bearer token)