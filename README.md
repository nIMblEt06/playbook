# Trackd

A music-focused social platform where you discover music through people you trust, not algorithms.

## What is Trackd?

- **For Music Discoverers:** Find new music through curated recommendations from people with similar taste
- **For Emerging Artists:** Get meaningful feedback from genuinely interested listeners
- **For Community Curators:** Build reputation by sharing quality finds and fostering discussions

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand
- **Backend:** Fastify, Prisma, PostgreSQL, Redis

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- Redis (optional, for caching)

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. **Configure environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your DATABASE_URL

   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Set up the database:**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

4. **Run the app:**
   ```bash
   # Terminal 1 - Backend (port 3001)
   cd backend && npm run dev

   # Terminal 2 - Frontend (port 3000)
   cd frontend && npm run dev
   ```

5. Open http://localhost:3000

## Project Structure

```
trackd/
├── backend/          # Fastify API server
├── frontend/         # Next.js app
```

## License

MIT
