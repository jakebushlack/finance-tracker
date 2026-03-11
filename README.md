# Finance Tracker

A portfolio-grade personal finance application demonstrating full-stack development, AI integration, and fintech patterns. This is a **preview/demo application** — Plaid integration runs in sandbox mode to showcase the integration architecture without requiring production credentials.

## Project Purpose

This project serves two goals:
1. **Personal Tool** — A genuinely useful finance tracker for CSV-based transaction analysis
2. **Portfolio Piece** — Demonstrates senior-level engineering skills including AI integration, third-party API patterns, and production-ready architecture

## Live Features

### Currently Working
- **CSV Import** — Upload Apple Card transaction exports (multi-format support coming)
- **AI Categorization** — Claude automatically categorizes transactions into standardized buckets
- **Spending Dashboard** — Visual breakdown by category with bar charts
- **Smart Insights** — AI-generated observations about spending patterns

### Coming Soon
- **User Authentication** — Clerk-based auth for persistent sessions
- **Data Persistence** — Supabase backend for transaction history
- **Plaid Sandbox Demo** — Full bank connection flow using Plaid's test environment
- **Financial Profile** — Tax optimization insights based on income and contributions

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Anthropic API key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key from [console.anthropic.com](https://console.anthropic.com) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| AI | Anthropic Claude API |
| Auth | Clerk (planned) |
| Database | Supabase Postgres (planned) |
| Bank Connections | Plaid Sandbox (planned) |

## Project Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](./CLAUDE.md) | AI agent instructions, code standards, architecture |
| [ROADMAP.md](./ROADMAP.md) | Feature backlog with prioritization and task breakdown |
| [TECHDEBT.md](./TECHDEBT.md) | Known issues and improvement opportunities |

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture Highlights

For portfolio reviewers, key architectural decisions include:

- **Server-side API calls** — All Claude API calls happen in Next.js API routes, never exposing keys to the client
- **Type-safe throughout** — Strict TypeScript with explicit interfaces for all data shapes
- **Prompt engineering patterns** — Structured JSON output requests with fallback parsing
- **Plaid sandbox architecture** — Demonstrates production integration patterns without requiring business relationships

## License

MIT
