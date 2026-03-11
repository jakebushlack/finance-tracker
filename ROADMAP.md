# Roadmap

Last updated: 2026-03-10

## Prioritization System

**Priority Score** = (Value × 2) + (5 - Complexity) + (5 - Risk)
- Higher score = do first
- Blocked items skip until dependencies clear

**Status Legend**
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

---

## Phase 1: Core Product (MVP)

### F1: CSV Import & Transaction Display
**Priority:** 14 | **Status:** Complete | **Complexity:** 2 | **Value:** 5 | **Risk:** 1

The foundation. Accept CSV uploads, parse transactions, display in table.

#### Tasks
- [x] File upload component with drag-and-drop
- [x] CSV parsing for Apple Card format
- [x] Transaction table with sorting
- [x] Amount formatting (positive/negative)
- [x] Date display formatting

---

### F2: Claude-Powered Categorization
**Priority:** 13 | **Status:** Complete | **Complexity:** 3 | **Value:** 5 | **Risk:** 2

Core differentiator. AI categorizes transactions and generates insights.

#### Tasks
- [x] API route for Claude integration
- [x] Transaction categorization prompt
- [x] Category badge display
- [x] Spending summary by category
- [x] Bar chart visualization
- [x] Plain-English insights generation

---

### F3: User Financial Profile
**Priority:** 13 | **Status:** Planned | **Complexity:** 3 | **Value:** 5 | **Risk:** 2

Elevates from tracker to advisor. Enables tax-aware insights.

#### Tasks
- [ ] Collapsible profile form component
- [ ] Income and filing status inputs
- [ ] Contribution tracking (Roth IRA, 401k, HSA)
- [ ] Charitable giving YTD field
- [ ] Open enrollment month selector
- [ ] Profile data passed to Claude prompts
- [ ] Tax optimization insights based on profile
- [ ] Contribution gap analysis
- [ ] IRS limit validation (2025 limits)
- [ ] Financial disclaimer on all insights

---

### F4: Specificity Toggle
**Priority:** 11 | **Status:** Planned | **Complexity:** 2 | **Value:** 3 | **Risk:** 1

Quality of life. User controls insight detail level.

#### Tasks
- [ ] Toggle component (General / Detailed)
- [ ] Preference stored in state
- [ ] Prompt instruction varies by mode
- [ ] General: directional advice, soft language
- [ ] Detailed: specific amounts, actionable steps

---

### F5: Multi-Format CSV Support
**Priority:** 14 | **Status:** Planned | **Complexity:** 3 | **Value:** 5 | **Risk:** 1

Critical for real use. CSV is permanent data path.

#### Tasks
- [ ] Format registry data structure
- [ ] Header detection on upload
- [ ] Apple Card parser (exists, extract to module)
- [ ] Chase CSV parser
- [ ] American Express CSV parser
- [ ] Capital One CSV parser
- [ ] Unrecognized format error message
- [ ] Format indicator in UI after detection

---

## Phase 2: Persistence & Auth

### F6: User Authentication
**Priority:** 13 | **Status:** Planned | **Complexity:** 2 | **Value:** 5 | **Risk:** 2

Foundation for persistence. Demonstrates production auth patterns.

**Dependencies:** None

#### Tasks
- [ ] Clerk account setup
- [ ] Clerk provider in layout
- [ ] Sign up flow
- [ ] Login flow
- [ ] Protected route middleware
- [ ] User context in app
- [ ] Logout functionality
- [ ] Auth state in header/nav

---

### F7: Database & Data Persistence
**Priority:** 12 | **Status:** Planned | **Complexity:** 3 | **Value:** 5 | **Risk:** 2

Required for any recurring use. Nothing survives refresh without this.

**Dependencies:** F6 (User Authentication)

#### Tasks
- [ ] Supabase project setup
- [ ] Users table (id, clerk_user_id, email, created_at)
- [ ] Financial profiles table
- [ ] Transaction imports table (id, user_id, import_date, source)
- [ ] Transactions table (with claude_category)
- [ ] Supabase client configuration
- [ ] Profile load on session start
- [ ] Profile save on form submit
- [ ] Transaction import persistence
- [ ] Transaction history query by date range
- [ ] Import batch browsing UI

---

## Phase 3: Plaid Sandbox Demo

### F8: Plaid Sandbox Integration
**Priority:** 11 | **Status:** Planned | **Complexity:** 3 | **Value:** 4 | **Risk:** 2

Portfolio showcase. Demonstrates fintech integration architecture.

**Dependencies:** F6 (User Authentication), F7 (Database)

#### Tasks
- [ ] Plaid developer account setup
- [ ] Plaid Link component integration
- [ ] Sandbox credentials configuration
- [ ] Institution connection flow
- [ ] Access token storage (encrypted)
- [ ] Transaction sync from Plaid
- [ ] Plaid transactions → standard format mapping
- [ ] "Sandbox Demo" indicator in UI
- [ ] Clear labeling that this uses test data
- [ ] CSV import still available alongside Plaid

---

## Phase 4: Polish & Portfolio

### F9: Portfolio / Resume Site
**Priority:** 14 | **Status:** Planned | **Complexity:** 3 | **Value:** 5 | **Risk:** 1

Career payoff. Finance tool is centerpiece case study.

**Dependencies:** Finance tool visually presentable

#### Tasks
- [ ] Separate Next.js project or subdomain
- [ ] Project case study: Finance Tracker
- [ ] Architecture diagrams
- [ ] Tech stack breakdown
- [ ] Code snippet highlights
- [ ] Professional profile section
- [ ] Contact information
- [ ] Responsive design
- [ ] Deploy to Vercel

---

### F10: Portfolio Investment Tracking
**Priority:** 9 | **Status:** Planned | **Complexity:** 4 | **Value:** 3 | **Risk:** 2

Nice-to-have. Rounds out financial picture if time permits.

**Dependencies:** F5 (Multi-Format CSV), F7 (Database)

#### Tasks
- [ ] Fidelity CSV parser
- [ ] Vanguard CSV parser
- [ ] Schwab CSV parser
- [ ] Portfolio value tracking
- [ ] Contribution history
- [ ] Asset allocation display
- [ ] Rebalancing suggestions via Claude
- [ ] Retirement goal pacing

---

## Backlog (Unprioritized)

These items are tracked but not scheduled:

- [ ] Dark mode support
- [ ] Export analyzed data to CSV
- [ ] Export analyzed data to PDF
- [ ] Monthly comparison views
- [ ] Budget setting interface
- [ ] Budget vs actual tracking
- [ ] Recurring transaction detection
- [ ] Subscription tracking
- [ ] Email summary reports
- [ ] Mobile-responsive improvements

---

## Priority Queue (Next Up)

Based on current scores and dependencies:

1. **F3: User Financial Profile** — Priority 13, no blockers
2. **F5: Multi-Format CSV Support** — Priority 14, no blockers
3. **F4: Specificity Toggle** — Priority 11, no blockers
4. **F6: User Authentication** — Priority 13, no blockers
5. **F7: Database & Data Persistence** — Priority 12, blocked by F6
6. **F8: Plaid Sandbox Integration** — Priority 11, blocked by F6, F7
