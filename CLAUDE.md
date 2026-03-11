# Claude Code Project Guide

This document provides context and standards for AI-assisted development of this project.

## Project Context

**Finance Tracker** is a portfolio-grade personal finance application. It serves as both a useful personal tool and a demonstration piece for senior engineering interviews.

### Key Constraints
- **Plaid is sandbox-only** — No production partnership. The integration demonstrates the architecture pattern.
- **CSV is permanent** — Not a workaround. CSV import is the primary data path for real user data.
- **Portfolio-first** — Code quality, architecture decisions, and documentation matter as much as features.

### Development Approach
- Reference [ROADMAP.md](./ROADMAP.md) for prioritized work
- Reference [TECHDEBT.md](./TECHDEBT.md) for known issues
- Update both files as work progresses
- Prefer completing tasks fully over starting new ones

## Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main UI (single-page app)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles (Tailwind)
│   └── api/
│       └── analyze/
│           └── route.ts          # Claude API integration
├── lib/                          # Shared utilities (future)
└── types/
    └── index.ts                  # Shared TypeScript types
```

### Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Framework | Next.js 16+ with App Router | Active |
| Language | TypeScript (strict mode) | Active |
| Styling | Tailwind CSS | Active |
| AI | Anthropic Claude API | Active |
| Auth | Clerk | Planned |
| Database | Supabase Postgres | Planned |
| Bank Connections | Plaid (sandbox only) | Planned |

### Data Flow (Current)

```
CSV Upload → parseCSV() → RawTransaction[] → /api/analyze → Claude API
                                                    ↓
                    UI Dashboard ← Transaction[] + insights[]
```

### Data Flow (Target with Persistence)

```
CSV Upload ─────────────────┐
                            ↓
Plaid Sandbox ──→ Transaction Sync ──→ Supabase ──→ /api/analyze ──→ Claude
                                           ↓
                           UI Dashboard ← Cached Results
```

## Code Standards

### TypeScript
- **Strict mode** — No `any` without justification
- **Explicit return types** on exported functions
- **Interface over type** for extensible shapes

### React Components
- **Functional only** with hooks
- **"use client"** for client-side interactivity
- **useCallback** for handlers passed to children
- **Descriptive state** — `isLoading` not `loading`

### API Routes
- **Validate input** at handler start
- **Appropriate status codes** — 400 bad input, 401 auth, 500 server
- **Structured errors** — `{ error: string }`
- **Server-side only** — Never expose API keys to client

### Claude API
- **Model**: `claude-sonnet-4-20250514`
- **Request JSON explicitly** in prompts
- **Parse with fallbacks** — Handle malformed responses gracefully
- **Include disclaimers** — Financial advice caveats on all insights

### Styling (Tailwind)
- **Utility-first** — Compose in className
- **Consistent spacing** — Use scale (p-4, mb-6, gap-3)
- **Tailwind defaults** — Avoid arbitrary values
- **Mobile-first** — sm:, md:, lg: breakpoints

## Categories

Fixed spending categories used throughout:

```typescript
type Category =
  | "Housing"       // Rent, mortgage, utilities
  | "Food & Drink"  // Groceries, restaurants, coffee
  | "Transport"     // Gas, uber, public transit
  | "Health"        // Pharmacy, doctors, gym
  | "Shopping"      // Amazon, retail, clothing
  | "Entertainment" // Streaming, games, events
  | "Income"        // Payments received, refunds
  | "Transfer"      // Venmo, bank transfers
  | "Other";        // Uncategorized
```

To add categories, update:
1. `src/types/index.ts` — Category type and CATEGORIES array
2. `src/app/page.tsx` — CATEGORY_COLORS mapping
3. `src/app/api/analyze/route.ts` — Claude prompt

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `CLERK_*` | Phase 2 | Clerk auth credentials |
| `SUPABASE_*` | Phase 2 | Supabase connection |
| `PLAID_*` | Phase 3 | Plaid sandbox credentials |

## Workflow Instructions

### When completing a feature
1. Mark relevant tasks complete in ROADMAP.md
2. Update any affected documentation
3. Check for tech debt introduced and log in TECHDEBT.md

### When starting work
1. Check ROADMAP.md for next priority task
2. Review TECHDEBT.md for related issues
3. Work on highest-priority unblocked item

### When introducing shortcuts
1. Add to TECHDEBT.md with complexity/value ratings
2. Note in commit message
3. Link to blocking roadmap items if relevant

## Git Workflow

- **Main branch**: `master`
- **Commit style**: Conventional commits
  - `feat:` new features
  - `fix:` bug fixes
  - `refactor:` code changes without behavior change
  - `docs:` documentation only
  - `chore:` maintenance tasks
- **No force pushes** to master

## Troubleshooting

### "Failed to analyze transactions"
1. Check `ANTHROPIC_API_KEY` in `.env.local`
2. Verify key at console.anthropic.com
3. Check browser console for errors

### CSV not parsing
1. Verify Apple Card column headers
2. Check for special characters
3. Confirm MM/DD/YYYY date format

### Build failures
```bash
npm run build  # Shows TypeScript errors
```
Common: missing types, unused vars, import paths
