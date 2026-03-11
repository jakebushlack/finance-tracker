# Finance Tracker

A personal finance tool that analyzes Apple Card CSV exports using Claude AI. Upload your transactions to get smart categorization, spending visualizations, and AI-generated insights.

## Features

- **CSV Upload** - Drag-and-drop Apple Card transaction exports
- **AI Categorization** - Claude automatically categorizes each transaction
- **Spending Dashboard** - Visual breakdown by category with bar charts
- **Smart Insights** - AI-generated observations about your spending patterns

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API key**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your Anthropic API key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key from [console.anthropic.com](https://console.anthropic.com) |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main UI
│   └── api/analyze/route.ts  # Claude API integration
└── types/index.ts            # TypeScript definitions
```

## Spending Categories

Transactions are categorized into:
- Housing, Food & Drink, Transport, Health
- Shopping, Entertainment, Income, Transfer, Other

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## AI Development

This project is maintained with Claude Code. See [CLAUDE.md](./CLAUDE.md) for development standards, architecture details, and contribution guidelines.

## License

MIT
