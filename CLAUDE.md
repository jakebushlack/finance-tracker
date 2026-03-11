# Claude Code Project Guide

This document provides context and standards for AI-assisted development of this project.

## Project Overview

**Finance Tracker** is a personal finance tool that analyzes Apple Card CSV exports using Claude AI. It categorizes transactions, visualizes spending patterns, and generates insights.

### Core Functionality

1. **CSV Upload** - Parse Apple Card transaction exports
2. **AI Categorization** - Claude categorizes each transaction into predefined buckets
3. **Dashboard** - Visualize spending by category with bar charts
4. **Insights** - AI-generated observations about spending patterns

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main UI (single-page app)
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles (Tailwind)
│   └── api/
│       └── analyze/
│           └── route.ts   # Claude API integration
└── types/
    └── index.ts           # Shared TypeScript types
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16+ with App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| State | React useState (no external state management) |
| Database | None (in-memory processing only) |

### Data Flow

```
CSV File → parseCSV() → RawTransaction[] → /api/analyze → Claude API
                                                ↓
UI Dashboard ← Transaction[] + insights[] ← JSON Response
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
- **Return appropriate HTTP status codes** (400 for bad input, 500 for server errors)
- **Structured error responses** with `{ error: string }` shape
- **Type the request body** explicitly

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.transactions || !Array.isArray(body.transactions)) {
    return NextResponse.json(
      { error: "Invalid transactions data" },
      { status: 400 }
    );
  }
  // ...
}
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
| Utilities | camelCase | `parseCSV.ts` |
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

Test API routes with mocked Claude responses:

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
- Upload CSV → See transactions table
- Click Analyze → See dashboard with categories
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

Store in `.env.local` (gitignored). Never commit API keys.

## Common Tasks

### Adding a New API Endpoint

1. Create route file: `src/app/api/[endpoint]/route.ts`
2. Export HTTP method handlers (GET, POST, etc.)
3. Add types to `src/types/index.ts` if needed
4. Update this documentation

### Modifying the Dashboard

The dashboard is in `src/app/page.tsx`. Key sections:
- Lines 150-210: Upload section
- Lines 220-280: Summary cards and bar chart
- Lines 285-305: Insights section
- Lines 310-370: Transactions table

### Updating Claude Prompts

Prompts are in `src/app/api/analyze/route.ts`:
- **Categorization prompt**: ~line 35
- **Insights prompt**: ~line 95

Keep prompts clear and request JSON output explicitly.

## Git Workflow

- **Main branch**: `master`
- **Commit style**: Conventional commits preferred
  - `feat: add export to PDF`
  - `fix: handle empty CSV files`
  - `refactor: extract parseCSV to utility`
- **No force pushes** to master

## Known Limitations

1. **No persistence** - Data is lost on page refresh
2. **Single file upload** - Can't combine multiple CSVs
3. **Apple Card format only** - Other bank formats not supported
4. **No authentication** - Single user, local use only

## Future Enhancements (Backlog)

These are potential features, not commitments:

- [ ] Support for other bank CSV formats
- [ ] Local storage persistence
- [ ] Export analyzed data to CSV/PDF
- [ ] Monthly comparison views
- [ ] Budget setting and tracking
- [ ] Dark mode support

## Troubleshooting

### "Failed to analyze transactions"

1. Check `ANTHROPIC_API_KEY` is set in `.env.local`
2. Verify API key is valid at console.anthropic.com
3. Check browser console for detailed errors

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
