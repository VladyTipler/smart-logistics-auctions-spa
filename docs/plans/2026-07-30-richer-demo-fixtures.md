# Richer Demo Fixtures Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the deterministic demo from 5 to 18 visually varied auctions.

**Architecture:** Keep the explicit seed table and existing seed-to-OpenAPI
factory. Preserve the first five records, add thirteen explicit seeds, and
extend the independent city option source so all routes are filterable.

**Tech Stack:** TypeScript, MSW v2, Vitest, Testing Library, Playwright.

---

### Task 1: Lock the 18-record contract with RED tests

**Files:**
- Modify: `src/shared/api/mocks/mock-backend.integration.test.ts`
- Modify: `src/pages/auction-list/auction-list.feature.integration.test.tsx`
- Modify: `e2e/pages-demo.spec.ts`

**Steps:**

1. Change backend expectations to `total: 18`, default page length `18`,
   `last_page: 9` for `per_page: 2`, and second-page order.
2. Add a feature integration scenario proving the default UI renders 10 cards,
   reports `Найдено: 18`, navigates through Router pagination, then renders 8
   cards on page 2.
3. Update the Pages E2E result count to 18.
4. Run:
   `powershell -Command "npx vitest run src/shared/api/mocks/mock-backend.integration.test.ts src/pages/auction-list/auction-list.feature.integration.test.tsx"`
5. Expected: FAIL because only 5 fixtures exist.

### Task 2: Add deterministic visual variety

**Files:**
- Modify: `src/shared/api/mocks/fixtures/auctions.fixture.ts`
- Modify: `src/features/auction-filters/model/city-options.ts`
- Test: files from Task 1

**Steps:**

1. Extend `AuctionSeed` with card-visible cargo fields.
2. Preserve seeds `SL-1001` through `SL-1005`.
3. Add explicit seeds `SL-1006` through `SL-1018` with unique UUIDs, routes,
   dates, prices, cargo summaries, auction types, statuses, and bid states.
4. Add every new route city to `cityOptions`.
5. Run the focused Vitest command from Task 1.
6. Expected: PASS.
7. Commit fixture and test changes.

### Task 3: Acceptance and handoff

**Files:**
- Modify: `README.md` only if fixture counts are documented
- Update: project wiki after verification

**Steps:**

1. Run `powershell -Command "npm run lint"`.
2. Run `powershell -Command "npm run typecheck"`.
3. Run `powershell -Command "npm test"`.
4. Run `powershell -Command "npm run build"`.
5. Run `powershell -Command "npm run test:e2e"`.
6. Run `powershell -Command "npm run test:e2e:demo"`.
7. Inspect the 1440px and 390px auction list in real Windows Chrome.
8. Run `/simplify` against `git diff 98038f0..HEAD`, re-run affected tests, and
   commit any simplification.
9. Run independent final review and update LLM Wiki.
10. Ask before pushing `main`, because that triggers public Pages deployment.

## Unresolved questions

None.
