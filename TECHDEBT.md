# Tech Debt

Last updated: 2026-03-10

## Prioritization System

**Priority Score** = (Value × 2) + (5 - Complexity)
- Higher score = fix sooner
- Items blocking roadmap features get +3 bonus

**Status Legend**
- `[ ]` Not started
- `[~]` In progress
- `[x]` Fixed
- `[!]` Blocking roadmap item

---

## Critical (Fix Before Phase 2)

### TD1: API Key Security Audit
**Priority:** 13 | **Status:** Not Started | **Complexity:** 2 | **Value:** 5

Ensure no API keys exposed to browser.

#### Issue
If Claude API calls happen in client components, the key is visible in network requests.

#### Impact
Key gets scraped, unexpected billing, account suspension.

#### Tasks
- [ ] Audit all fetch calls in client components
- [ ] Verify no Authorization headers in browser devtools
- [ ] Confirm all Claude calls in /api routes
- [ ] Add server-only comment to API route files

---

### TD2: Claude API Error Handling
**Priority:** 11 | **Status:** Not Started | **Complexity:** 2 | **Value:** 4

Silent failures hurt demos and hide billing issues.

#### Issue
Minimal error handling on API calls. Failures show nothing or crash.

#### Impact
Poor demo experience, difficult to diagnose quota/cost issues.

#### Tasks
- [ ] Wrap analyze route in try/catch
- [ ] Return structured error response
- [ ] Add loading state to UI
- [ ] Add error state to UI
- [ ] Add empty state for no transactions
- [ ] Log errors with context (status, request size)

---

### TD3: Transaction Batching
**Priority:** 10 | **Status:** Not Started | **Complexity:** 3 | **Value:** 4

Will hit token limits with real transaction volumes.

#### Issue
All transactions sent in single API call. Real monthly data will exceed context limits.

#### Impact
Silent failures or truncated results above threshold.

#### Tasks
- [ ] Determine safe batch size (50-100 transactions)
- [ ] Implement chunking logic
- [ ] Process batches in parallel
- [ ] Reassemble categorization results
- [ ] Keep insights as single call on summary data

---

## High (Fix During Phase 2)

### TD4: CSV Input Validation
**Priority:** 13 | **Status:** Not Started | **Complexity:** 2 | **Value:** 5

**Blocks:** F5 (Multi-Format CSV Support)

CSV is permanent feature. Silent failures on wrong format unacceptable.

#### Issue
Parser assumes Apple Card format. Other CSVs produce garbage or crash.

#### Impact
Core feature broken for non-Apple Card users.

#### Tasks
- [ ] Define expected headers for Apple Card
- [ ] Check headers on upload before parsing
- [ ] Return specific error for wrong format
- [ ] Show user-friendly message with expected format
- [ ] Prepare for format registry pattern

---

### TD5: Financial Profile Not Persisted
**Priority:** 13 | **Status:** Not Started | **Complexity:** 2 | **Value:** 5

**Blocks:** Useful financial insights

Profile in React state lost on every refresh.

#### Issue
User re-enters income, contributions, etc. every session.

#### Impact
Tax intelligence features unusable for recurring use.

#### Tasks
- [ ] LocalStorage persistence as interim solution
- [ ] Load profile on mount
- [ ] Save profile on change
- [ ] Migrate to Supabase when F7 complete
- [ ] Clear migration path documented

---

### TD6: No Test Coverage
**Priority:** 8 | **Status:** Not Started | **Complexity:** 4 | **Value:** 3

Risk grows as codebase grows. Acceptable now, required before Plaid.

#### Issue
No unit or integration tests.

#### Impact
Regressions during Phase 2 integration will be time-consuming.

#### Tasks
- [ ] Add Vitest to project
- [ ] Configure test scripts in package.json
- [ ] Test: parseCSV with valid input
- [ ] Test: parseCSV with invalid input
- [ ] Test: parseCSV with edge cases (quotes, commas)
- [ ] Test: category mapping logic
- [ ] Test: analyze API route with mocked Claude
- [ ] Add test coverage to CI (future)

---

### TD7: Multi-Format CSV Architecture
**Priority:** 13 | **Status:** Not Started | **Complexity:** 3 | **Value:** 5

**Blocks:** F5 (Multi-Format CSV Support)

No abstraction for multiple CSV formats.

#### Issue
Parser hardcoded for Apple Card. Adding Chase requires forking logic.

#### Impact
Every new institution is messy one-off implementation.

#### Tasks
- [ ] Define FormatDefinition interface
- [ ] Create format registry array
- [ ] Extract Apple Card parser to module
- [ ] Implement header-based format detection
- [ ] Refactor parseCSV to use registry
- [ ] Document adding new formats

---

## Medium (Fix When Convenient)

### TD8: Google Drive Code Removal
**Priority:** 7 | **Status:** Fixed | **Complexity:** 2 | **Value:** 2

Dead code from abandoned feature.

#### Issue
Google Drive integration exists but doesn't work (requires GCP billing).

#### Impact
Confusing codebase, non-functional UI elements.

#### Tasks
- [x] Remove src/lib/google-drive.ts
- [x] Remove /api/auth/google route
- [x] Remove /api/auth/callback route
- [x] Remove /api/drive routes
- [x] Remove Drive-related UI from page.tsx
- [x] Remove Drive env vars from .env.local.example
- [x] Update CLAUDE.md architecture diagram

---

### TD9: Hardcoded IRS Limits
**Priority:** 6 | **Status:** Not Started | **Complexity:** 2 | **Value:** 2

IRS limits change annually. Currently hardcoded in prompts.

#### Issue
2025 limits in Claude prompts. Will be wrong in 2026.

#### Impact
Incorrect contribution gap analysis after year change.

#### Tasks
- [ ] Extract limits to constants file
- [ ] Add year alongside limits
- [ ] Reference constants in prompts
- [ ] Add reminder comment for annual update
- [ ] Consider fetching from IRS API (future)

---

### TD10: No Loading Skeleton
**Priority:** 5 | **Status:** Not Started | **Complexity:** 2 | **Value:** 1

Polish item. Spinner is functional but skeletons are nicer.

#### Issue
Loading state is just a spinner. No content preview.

#### Impact
Slightly worse perceived performance.

#### Tasks
- [ ] Create skeleton components for cards
- [ ] Create skeleton for transaction table
- [ ] Create skeleton for insights section
- [ ] Swap spinner for skeletons

---

## Debt Introduced Log

Track when debt is added so it doesn't accumulate silently.

| Date | Item | Reason | Planned Fix |
|------|------|--------|-------------|
| 2026-03-10 | TD8 | Google Drive abandoned | Phase 2 cleanup |
| 2026-03-10 | TD5 | MVP speed | Phase 2 database |

---

## Recently Fixed

### TD8: Google Drive Code Removal (2026-03-10)
Removed abandoned Google Drive integration code. Files deleted: `src/lib/google-drive.ts`, `/api/auth/*`, `/api/drive/*`. UI cleaned from page.tsx.
