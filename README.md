# 🛸 Nerderland Web

**“Inside every mystery, mystery...”**

_The Social arena for Nerds_

The main web application for Nerderland - where nerds gather to share stories, build discourse, and level up their nerdity.

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [localhost:3000](http://localhost:3000) and welcome to the arena.

## What's Inside

- **Next.js 14** - The React framework for the web
- **Tailwind CSS** - For when you need pixels to behave
- **Drizzle ORM** - Type-safe database queries that just work
- **Wallet Connect** - Web3 authentication made simple
- **Cloudinary** - Image uploads

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your secrets. You'll need:

- Database connection string
- NextAuth secret (make it random)
- Wallet Connect project ID
- Cloudinary credentials

## Project Structure

```
app/              # Next.js routes and API endpoints
components/       # Reusable UI components
hooks/           # Custom React hooks
lib/             # Utilities and configurations
stores/          # State management
```

## Deployment

This app lives happily on Vercel. Just connect your repo and deploy.

## Contributing

Found a bug? Have an idea? Pull requests welcome. Keep it nerdy.

---

_Built by humans, floating in space • Nerderland Social Arena, 2025_ 🛸
