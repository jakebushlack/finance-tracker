# Claude Code Project Guide

This document provides context and standards for AI-assisted development of this project.

## Project Overview

**Finance Tracker** is a personal finance tool that analyzes CSV exports using Claude AI. It connects to Google Drive to auto-load statements, categorizes transactions, visualizes spending patterns, and generates insights.

### Core Functionality

1. **Google Drive Integration** - Auto-load CSV files from a Drive folder
2. **CSV Upload** - Manual upload as fallback
3. **AI Categorization** - Claude categorizes each transaction into predefined buckets
4. **Dashboard** - Visualize spending by category with bar charts
5. **Insights** - AI-generated observations about spending patterns

## Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main UI (single-page app)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles (Tailwind)
│   └── api/
│       ├── analyze/
│       │   └── route.ts          # Claude API integration
│       ├── auth/
│       │   ├── google/
│       │   │   └── route.ts      # Initiate OAuth flow
│       │   └── callback/
│       │       └── route.ts      # OAuth callback handler
│       └── drive/
│           ├── folders/
│           │   └── route.ts      # List Drive folders
│           └── files/
│               └── route.ts      # List/fetch Drive files
├── lib/
│   └── google-drive.ts           # Google Drive API utilities
└── types/
    └── index.ts                  # Shared TypeScript types
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ with App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Cloud Storage | Google Drive API |
| State | React useState (no external state management) |
| Database | None (in-memory processing only) |

### Data Flow

```
Google Drive Folder
        │
        ▼
/api/drive/files ──► CSV Content ──► parseCSV() ──► RawTransaction[]
        │                                                 │
        ▼                                                 ▼
 localStorage                               /api/analyze ──► Claude API
 (folder pref)                                                  │
                                                               ▼
                             UI Dashboard ◄── Transaction[] + insights[]
```

### Authentication Flow

```
User clicks "Connect to Drive"
        │
        ▼
/api/auth/google ──► Generate OAuth URL ──► Redirect to Google
        │
        ▼
User grants permission
        │
        ▼
Google redirects to /api/auth/callback
        │
        ▼
Exchange code for tokens ──► Redirect to / with tokens in URL
        │
        ▼
Frontend stores tokens in localStorage
```

## Code Standards

### TypeScript

- **Strict mode enabled** - No `any` types without justification
- **Explicit return types** on exported functions
- **Interface over type** for object shapes that may be extended
- **Const assertions** for literal types

```typescript
// Good
interface Transaction {
  id: string;
  amount: number;
}

// Avoid
type Transaction = {
  id: any;
  amount: any;
}
```

### React Components

- **Functional components only** with hooks
- **"use client"** directive required for client-side interactivity
- **useCallback** for event handlers passed to children
- **Descriptive state names** - `isLoading` not `loading`

```typescript
// Good
const [isLoading, setIsLoading] = useState(false);
const [transactions, setTransactions] = useState<Transaction[]>([]);

// Avoid
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
```

### API Routes

- **Validate input** at the start of each handler
- **Return appropriate HTTP status codes** (400 for bad input, 401 for auth, 500 for server errors)
- **Structured error responses** with `{ error: string }` shape
- **Type the request body** explicitly
- **Check Authorization header** for protected routes

```typescript
export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.transactions || !Array.isArray(body.transactions)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  // ...
}
```

### Google Drive Integration

- **OAuth 2.0** with offline access for refresh tokens
- **Scope**: `drive.readonly` (minimum required)
- **Token storage**: localStorage (client-side only)
- **Folder preference**: Persisted in localStorage

```typescript
// src/lib/google-drive.ts contains all Drive utilities
import { getOAuth2Client, getDriveClient, listCSVFiles } from "@/lib/google-drive";
```

### Claude API Integration

- **Model**: Use `claude-sonnet-4-20250514` for cost-effective analysis
- **Structured output**: Request JSON responses, parse with fallbacks
- **Error handling**: Always handle API failures gracefully

```typescript
// Request JSON output explicitly
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: `...Respond with ONLY a JSON array...`
  }]
});

// Parse with fallback
try {
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    result = JSON.parse(jsonMatch[0]);
  }
} catch {
  result = defaultValue;
}
```

### Styling (Tailwind)

- **Utility-first** - Compose styles in className
- **Consistent spacing** - Use Tailwind's spacing scale (p-4, mb-6, gap-3)
- **Color palette** - Stick to Tailwind defaults (gray, blue, green, etc.)
- **Responsive** - Mobile-first with sm:, md:, lg: breakpoints

```tsx
// Good - consistent, responsive
<div className="p-4 md:p-6 bg-white rounded-lg shadow">

// Avoid - arbitrary values
<div className="p-[17px] bg-[#f5f5f5]">
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TransactionTable.tsx` |
| Utilities | camelCase | `google-drive.ts` |
| Types | PascalCase | `types/Transaction.ts` |
| API routes | lowercase | `api/analyze/route.ts` |
| Test files | `*.test.ts` | `parseCSV.test.ts` |

## Categories

The app uses these fixed spending categories:

```typescript
type Category =
  | "Housing"      // Rent, mortgage, utilities
  | "Food & Drink" // Groceries, restaurants, coffee
  | "Transport"    // Gas, uber, public transit
  | "Health"       // Pharmacy, doctors, gym
  | "Shopping"     // Amazon, retail, clothing
  | "Entertainment"// Streaming, games, events
  | "Income"       // Payments received, refunds
  | "Transfer"     // Venmo, bank transfers
  | "Other";       // Uncategorized
```

When adding new features, maintain these categories. If new categories are needed, update:
1. `src/types/index.ts` - Add to Category type and CATEGORIES array
2. `src/app/page.tsx` - Add color to CATEGORY_COLORS
3. `src/app/api/analyze/route.ts` - Update Claude prompt

## Testing Expectations

### Unit Tests (Priority)

Test pure functions in isolation:

```typescript
// src/lib/parseCSV.test.ts
describe('parseCSV', () => {
  it('parses valid Apple Card CSV format', () => {
    const csv = `Transaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD)
01/15/2024,01/16/2024,UBER TRIP,Uber,Travel,Purchase,-24.50`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].Merchant).toBe('Uber');
    expect(result[0]['Amount (USD)']).toBe('-24.50');
  });

  it('handles quoted fields with commas', () => {
    // ...
  });

  it('returns empty array for invalid input', () => {
    // ...
  });
});
```

### Integration Tests

Test API routes with mocked responses:

```typescript
// src/app/api/analyze/route.test.ts
describe('/api/analyze', () => {
  it('returns categorized transactions', async () => {
    // Mock Anthropic client
    // POST to endpoint
    // Assert response structure
  });

  it('returns 400 for invalid input', async () => {
    // ...
  });
});
```

### E2E Tests (Future)

Consider Playwright for critical user flows:
- Connect to Google Drive → Select folder → See files loaded
- Upload CSV → Click Analyze → See dashboard with categories
- Verify insights are displayed

### Test Commands

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key from console.anthropic.com |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | Defaults to `http://localhost:3000/api/auth/callback` |

Store in `.env.local` (gitignored). Never commit API keys or secrets.

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable the **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
7. Copy Client ID and Client Secret to `.env.local`

## Common Tasks

### Adding a New API Endpoint

1. Create route file: `src/app/api/[endpoint]/route.ts`
2. Export HTTP method handlers (GET, POST, etc.)
3. Add types to `src/types/index.ts` if needed
4. Update this documentation

### Modifying the Dashboard

The dashboard is in `src/app/page.tsx`. Key sections:
- Google Drive connection: lines 80-180
- File loading/upload: lines 180-280
- Summary cards and bar chart: lines 320-400
- Insights section: lines 400-430
- Transactions table: lines 430-500

### Updating Claude Prompts

Prompts are in `src/app/api/analyze/route.ts`:
- **Categorization prompt**: ~line 35
- **Insights prompt**: ~line 95

Keep prompts clear and request JSON output explicitly.

### Adding Support for New CSV Formats

1. Identify the column headers for the new format
2. Create a format detection function in `parseCSV()`
3. Map the columns to `RawTransaction` fields
4. Test with sample files from that provider

## Git Workflow

- **Main branch**: `master`
- **Commit style**: Conventional commits preferred
  - `feat: add export to PDF`
  - `fix: handle empty CSV files`
  - `refactor: extract parseCSV to utility`
- **No force pushes** to master

## Known Limitations

1. **No persistence** - Analyzed data is lost on page refresh
2. **Apple Card format only** - Other bank formats need manual mapping
3. **No authentication** - Single user, local use only
4. **Token expiry** - OAuth tokens may expire and require reconnection

## Future Enhancements (Backlog)

These are potential features, not commitments:

- [ ] Support for other bank CSV formats (Chase, Amex, etc.)
- [ ] Persist analyzed data to localStorage or IndexedDB
- [ ] Export analyzed data to CSV/PDF
- [ ] Monthly comparison views
- [ ] Budget setting and tracking
- [ ] Dark mode support
- [ ] Automatic token refresh

## Troubleshooting

### "Failed to analyze transactions"

1. Check `ANTHROPIC_API_KEY` is set in `.env.local`
2. Verify API key is valid at console.anthropic.com
3. Check browser console for detailed errors

### "Google Drive session expired"

1. Click "Disconnect" then "Connect to Drive" again
2. Re-authorize the application
3. Check that OAuth credentials are still valid in Google Cloud Console

### CSV not parsing correctly

1. Ensure CSV has the expected Apple Card headers
2. Check for special characters in merchant names
3. Verify date format is MM/DD/YYYY

### Build failures

```bash
npm run build  # Check for TypeScript errors
```

Common issues:
- Missing type annotations
- Unused variables (remove or prefix with `_`)
- Import path errors (use `@/` alias)
