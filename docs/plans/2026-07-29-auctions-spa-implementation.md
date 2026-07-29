# Cargo Auctions SPA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and verify a public, employer-ready SPA for browsing cargo auctions, viewing details and bid history, and placing stateful mocked bids.

**Architecture:** Feature-Sliced Design separates app composition, pages, widgets, features, entities, and shared infrastructure. OpenAPI-generated DTOs feed typed HTTP services, TanStack Query, ViewModel mappers, and a single private MSW store. Confidence comes from route-level feature integration tests and three Playwright user flows.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS 4, Base UI 1.6, React Hook Form, Zod, Zustand, MSW 2, Vitest, Testing Library, Playwright.

---

## Execution rules

- Use `frontend-design` for every UI implementation and screenshot critique task.
- Use `test-driven-development` for features and bug fixes.
- Use `verification-before-completion` before every completion claim.
- Run all `npm` and `npx` commands through PowerShell.
- Keep React component definitions in `*.component.tsx`.
- Use the OpenAPI schema as the DTO source of truth.
- Do not commit the supplied PDF.
- Commit after each green feature slice with concise messages.

## Task 1: Repository and toolchain foundation

**Files:**

- Create: `.gitignore`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`
- Create: `src/app/app.component.tsx`
- Create: `src/app/styles/index.css`
- Create: `src/app/app.smoke.test.tsx`
- Create: `src/shared/config/test/setup-tests.ts`
- Create: `public/mockServiceWorker.js`

**Step 1: Initialise npm and check runtime**

Run:

```powershell
powershell -Command "node --version; npm --version; npm init -y"
```

Expected: supported Node version and a new `package.json`.

**Step 2: Install runtime dependencies**

Run:

```powershell
powershell -Command "npm install react@19.2.8 react-dom@19.2.8 @tanstack/react-router@1.170.18 @tanstack/react-query@5.101.4 @base-ui/react@1.6.0 tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 lucide-react zustand react-hook-form zod @hookform/resolvers msw@2.15.0 @fontsource-variable/manrope @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono"
```

**Step 3: Install development dependencies**

Run:

```powershell
powershell -Command "npm install -D vite@8.1.5 typescript@7.0.2 @vitejs/plugin-react openapi-typescript@7.13.0 vitest@4.1.10 @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test@1.62.0 eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh"
```

**Step 4: Configure scripts**

Add:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "api:generate": "openapi-typescript ./openapi.auctions.v0.json -o ./src/shared/api/generated/auctions-api.ts"
  }
}
```

**Step 5: Configure Vite, TypeScript, ESLint, Vitest, and Tailwind**

Use `@vitejs/plugin-react`, `@tailwindcss/vite`, `jsdom`, and `src/shared/config/test/setup-tests.ts`. Configure the `@` alias to `src`.

Start CSS with:

```css
@import "tailwindcss";

@theme {
  --color-snow-field: #f4f7f8;
  --color-freight-ink: #15232d;
  --color-route-blue: #1e5eff;
  --color-signal-orange: #f06a2a;
  --color-status-teal: #087f6b;
  --color-steel: #d8e0e5;
  --font-display: "Manrope Variable", sans-serif;
  --font-sans: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}
```

**Step 6: Write the failing smoke test**

```tsx
it("renders the application shell", () => {
  render(<App />);
  expect(screen.getByRole("main")).toBeInTheDocument();
});
```

**Step 7: Run the smoke test and observe failure**

Run:

```powershell
powershell -Command "npm test -- src/app/app.smoke.test.tsx"
```

Expected: FAIL before `App` exists.

**Step 8: Implement the minimal shell and MSW bootstrap**

Import fonts and global CSS. Start the browser worker only in development before rendering React.

Run:

```powershell
powershell -Command "npx msw init public --save"
```

**Step 9: Verify foundation**

Run:

```powershell
powershell -Command "npm run lint; npm run typecheck; npm test; npm run build"
```

Expected: all green.

**Step 10: Commit**

```powershell
git add .
git commit -m "chore: scaffold application"
```

## Task 2: OpenAPI types and typed HTTP boundary

**Files:**

- Track: `openapi.auctions.v0.json`
- Create: `src/shared/api/generated/auctions-api.ts`
- Create: `src/shared/api/contracts.ts`
- Create: `src/shared/api/http-client.ts`
- Create: `src/shared/api/api-error.ts`
- Create: `src/shared/api/http-client.integration.test.ts`

**Step 1: Generate DTO types**

Run:

```powershell
powershell -Command "npm run api:generate"
```

**Step 2: Define aliases from generated components**

```ts
export type AuctionListRequest =
  components["schemas"]["AuctionListRequest"];
export type AuctionListResponse =
  components["schemas"]["AuctionListResponseBase"];
export type AuctionDetail =
  components["schemas"]["AuctionShowResponse"];
export type BetListResponse =
  components["schemas"]["BetListResponse"];
export type SetBetRequest =
  components["schemas"]["SetBetRequest"];
```

**Step 3: Write failing HTTP integration tests**

Cover:

- Base URL `/api/v1`.
- JSON request body.
- `application/problem+json`.
- Empty successful response body.

**Step 4: Run focused test**

```powershell
powershell -Command "npm test -- src/shared/api/http-client.integration.test.ts"
```

Expected: FAIL because client and error mapper do not exist.

**Step 5: Implement client**

The client must:

- Join the relative API base and endpoint safely.
- Set `Accept: application/json, application/problem+json`.
- Set `Content-Type` only when a body exists.
- Return `undefined` for empty successful bodies.
- Throw `ApiError` with status and parsed problem document.

**Step 6: Regenerate and verify drift**

Run:

```powershell
powershell -Command "npm run api:generate; git diff --exit-code -- src/shared/api/generated/auctions-api.ts; npm test -- src/shared/api/http-client.integration.test.ts; npm run typecheck"
```

**Step 7: Commit**

```powershell
git add openapi.auctions.v0.json src/shared/api package.json package-lock.json
git commit -m "feat: add typed API client"
```

## Task 3: Stateful MSW backend

**Files:**

- Create: `src/shared/api/mocks/fixtures/auctions.fixture.ts`
- Create: `src/shared/api/mocks/fixtures/cities.fixture.ts`
- Create: `src/shared/api/mocks/mock-database.ts`
- Create: `src/shared/api/mocks/auction-list-filter.ts`
- Create: `src/shared/api/mocks/handlers.ts`
- Create: `src/shared/api/mocks/browser.ts`
- Create: `src/shared/api/mocks/server.ts`
- Create: `src/shared/api/mocks/mock-backend.integration.test.ts`

**Step 1: Write failing contract scenarios**

Test through HTTP:

1. POST list returns contract-shaped `data` and `meta`.
2. Filtering and pagination change the response.
3. Detail resolves by `main.order_uid`.
4. Bets support `all=true`.
5. Valid POST bid changes list, detail, and bets.
6. Invalid POST returns `422 ValidationProblem`.
7. Unknown UUID returns `404 ProblemDetail`.

**Step 2: Verify red**

```powershell
powershell -Command "npm test -- src/shared/api/mocks/mock-backend.integration.test.ts"
```

**Step 3: Implement a resettable database**

The database owns normalised:

- Auctions.
- Details.
- Bets.
- Current user/subscriber.
- Monotonic bid IDs.

Expose only `resetMockDatabase()` to tests and handler operations to MSW. Never export raw mutable collections to application code.

**Step 4: Implement list filtering**

Cover required filters exactly:

- `cargo_num`
- `status`
- `statuses`
- `auc_type`
- `load_city`
- `unload_city`
- `load_date_from/to`
- `is_available`
- `is_bidder`
- `current_price_from/to`

**Step 5: Implement bid mutation**

On success update:

- List `trading.price.current`.
- Detail `trading.price.current` and `available`.
- Detail/list `trading.your`.
- User trading status.
- Bid collection and ranks.

Forbidden bid returns:

```json
{
  "code": "bet_not_allowed",
  "title": "Ставка недоступна",
  "message": "В этом аукционе нельзя установить ставку",
  "errors": []
}
```

**Step 6: Verify state transitions**

```powershell
powershell -Command "npm test -- src/shared/api/mocks/mock-backend.integration.test.ts"
```

Expected: all contract scenarios PASS.

**Step 7: Commit**

```powershell
git add src/shared/api/mocks
git commit -m "feat: add stateful auction mocks"
```

## Task 4: Application providers and route tree

**Files:**

- Create: `src/app/providers/app-providers.component.tsx`
- Create: `src/app/router/router.ts`
- Create: `src/app/router/root.route.ts`
- Create: `src/app/router/auctions.route.ts`
- Create: `src/app/router/auction-detail.route.ts`
- Create: `src/app/router/auction-bets.route.ts`
- Create: `src/app/router/auction-bet.route.ts`
- Create: `src/app/layout/app-shell.component.tsx`
- Create: `src/pages/auction-list/auction-list-page.component.tsx`
- Create: `src/pages/auction-detail/auction-detail-page.component.tsx`
- Create: `src/pages/auction-bets/auction-bets-page.component.tsx`
- Create: `src/pages/auction-bet/auction-bet-page.component.tsx`
- Create: `src/shared/config/test/render-app.tsx`
- Create: `src/app/router/router.integration.test.tsx`

**Step 1: Write failing direct-route tests**

Use a memory history and real providers. Verify all four URLs render their page heading.

**Step 2: Verify red**

```powershell
powershell -Command "npm test -- src/app/router/router.integration.test.tsx"
```

**Step 3: Implement providers and routes**

Use code-based routes. Components live outside route config files. Query defaults:

- No retries for 4xx.
- One retry for 503/network.
- Stable test QueryClient with retries disabled.

**Step 4: Apply frontend-design shell**

Use the approved Dispatch Board tokens. Keep the header operational and quiet; no KPI cards, gradients, or decorative dashboard widgets.

**Step 5: Verify**

```powershell
powershell -Command "npm test -- src/app/router/router.integration.test.tsx; npm run typecheck"
```

**Step 6: Commit**

```powershell
git add src/app src/pages src/shared/config/test src/main.tsx
git commit -m "feat: add application routes"
```

## Task 5: Search params and list request builder

**Files:**

- Create: `src/features/auction-filters/model/auction-search.schema.ts`
- Create: `src/features/auction-filters/model/build-auction-list-request.ts`
- Create: `src/features/auction-filters/model/auction-search.test.ts`
- Create: `src/features/auction-filters/model/build-auction-list-request.test.ts`

**Step 1: Write failing table-driven tests**

Cover:

- Malformed page/per-page fallbacks.
- String and integer array parsing.
- Empty values omitted.
- Date-only inputs converted to ISO offset boundaries.
- Price from/to.
- `auc_type` array.

**Step 2: Verify red**

```powershell
powershell -Command "npm test -- src/features/auction-filters/model"
```

**Step 3: Implement schemas**

Defaults:

- `page = 1`
- `perPage = 10`
- Empty arrays and strings become `undefined` in the API request.
- Invalid enum values are discarded safely.

Use decimal strings in URL state and convert only in the request builder.

**Step 4: Verify green**

```powershell
powershell -Command "npm test -- src/features/auction-filters/model"
```

**Step 5: Commit**

```powershell
git add src/features/auction-filters
git commit -m "feat: add auction search model"
```

## Task 6: Auction list feature

**Files:**

- Create: `src/entities/auction/api/auction-api.ts`
- Create: `src/entities/auction/api/auction.queries.ts`
- Create: `src/entities/auction/model/auction-card.vm.ts`
- Create: `src/entities/auction/model/map-auction-card.ts`
- Create: `src/entities/auction/model/map-auction-card.test.ts`
- Create: `src/entities/auction/ui/auction-card.component.tsx`
- Create: `src/entities/auction/ui/route-rail.component.tsx`
- Create: `src/entities/auction/ui/auction-status.component.tsx`
- Create: `src/features/auction-filters/ui/auction-filters.component.tsx`
- Create: `src/features/auction-filters/ui/mobile-auction-filters.component.tsx`
- Create: `src/features/auction-pagination/ui/auction-pagination.component.tsx`
- Create: `src/widgets/auction-list/ui/auction-list.component.tsx`
- Create: `src/widgets/auction-list/ui/auction-list-skeleton.component.tsx`
- Create: `src/widgets/auction-list/ui/auction-list-empty.component.tsx`
- Create: `src/widgets/auction-list/ui/auction-list-error.component.tsx`
- Create: `src/pages/auction-list/auction-list.feature.integration.test.tsx`

**Step 1: Write failing ViewModel tests**

Cover nullable price, optional route/cargo, unknown enums, and action label inputs.

**Step 2: Write failing feature integration test**

Render `/auctions` and verify:

1. Skeleton appears.
2. Cards and pagination load.
3. Changing filters updates URL.
4. Correct POST body reaches MSW.
5. Results change.
6. Pagination changes page.
7. Hover intent requests detail.

**Step 3: Verify red**

```powershell
powershell -Command "npm test -- src/entities/auction/model/map-auction-card.test.ts src/pages/auction-list/auction-list.feature.integration.test.tsx"
```

**Step 4: Implement query options, mapper, and UI**

Use semantic buttons/links, Base UI Select/Combobox/Drawer, and the horizontal route rail. Preserve readable density at 320px.

**Step 5: Verify green**

```powershell
powershell -Command "npm test -- src/entities/auction/model/map-auction-card.test.ts src/pages/auction-list/auction-list.feature.integration.test.tsx"
```

**Step 6: Run frontend-design critique**

Inspect desktop and 390px screenshots. Remove generic card chrome, unnecessary badges, and decoration not tied to route, status, or bidding.

**Step 7: Commit**

```powershell
git add src/entities/auction src/features/auction-filters src/features/auction-pagination src/widgets/auction-list src/pages/auction-list
git commit -m "feat: add auction list"
```

## Task 7: Detail ViewModel and access policy

**Files:**

- Create: `src/entities/auction/model/auction-access.ts`
- Create: `src/entities/auction/model/auction-access.test.ts`
- Create: `src/entities/auction/model/auction-detail.vm.ts`
- Create: `src/entities/auction/model/map-auction-detail.ts`
- Create: `src/entities/auction/model/map-auction-detail.test.ts`
- Create: `src/entities/auction/ui/route-timeline.component.tsx`
- Create: `src/widgets/auction-detail/ui/auction-detail.component.tsx`
- Create: `src/widgets/auction-detail/ui/auction-main-section.component.tsx`
- Create: `src/widgets/auction-detail/ui/auction-cargo-section.component.tsx`
- Create: `src/widgets/auction-detail/ui/auction-payment-section.component.tsx`
- Create: `src/widgets/auction-detail/ui/auction-organizer-section.component.tsx`
- Create: `src/widgets/auction-trading-panel/ui/auction-trading-panel.component.tsx`
- Create: `src/pages/auction-detail/auction-detail.feature.integration.test.tsx`

**Step 1: Write failing policy tests**

Cover every flag independently and in combination:

- Both `hide_bets_history` locations use OR.
- Cities survive hidden addresses.
- Contacts and route contacts disappear.
- Cargo valuation disappears while trading price remains.
- Places disappear independently.

**Step 2: Write failing direct-link integration test**

Open detail URL directly and verify loader, content, 404 state, and restricted fields.

**Step 3: Verify red**

```powershell
powershell -Command "npm test -- src/entities/auction/model/auction-access.test.ts src/entities/auction/model/map-auction-detail.test.ts src/pages/auction-detail/auction-detail.feature.integration.test.tsx"
```

**Step 4: Implement policy, mapper, and page**

Components receive only the sanitised ViewModel. Use the vertical route timeline and sticky trading panel.

**Step 5: Verify**

```powershell
powershell -Command "npm test -- src/entities/auction/model src/pages/auction-detail/auction-detail.feature.integration.test.tsx"
```

**Step 6: Commit**

```powershell
git add src/entities/auction src/widgets/auction-detail src/widgets/auction-trading-panel src/pages/auction-detail
git commit -m "feat: add auction detail"
```

## Task 8: Bid history feature

**Files:**

- Create: `src/entities/bet/api/bet-api.ts`
- Create: `src/entities/bet/api/bet.queries.ts`
- Create: `src/entities/bet/model/bet-history.vm.ts`
- Create: `src/entities/bet/model/map-bet-history.ts`
- Create: `src/entities/bet/model/map-bet-history.test.ts`
- Create: `src/entities/bet/ui/bet-table.component.tsx`
- Create: `src/entities/bet/ui/bet-card.component.tsx`
- Create: `src/widgets/bet-history/ui/bet-history.component.tsx`
- Create: `src/widgets/bet-history/ui/bet-history-empty.component.tsx`
- Create: `src/widgets/bet-history/ui/bet-history-hidden.component.tsx`
- Create: `src/pages/auction-bets/auction-bets.feature.integration.test.tsx`

**Step 1: Write failing mapper tests**

Cover:

- Unique participant count by `subscriber_id`.
- VAT and no-VAT prices.
- Winner/rejected/cancel reason.
- Hidden places.

**Step 2: Write failing feature tests**

Cover:

- Request uses `all=true`.
- Empty list.
- Hidden history makes zero bets requests.
- Desktop semantic table content.
- Mobile card content.

**Step 3: Implement**

Load detail first, evaluate access, then enable the bets query only when visible.

**Step 4: Verify**

```powershell
powershell -Command "npm test -- src/entities/bet src/pages/auction-bets/auction-bets.feature.integration.test.tsx"
```

**Step 5: Commit**

```powershell
git add src/entities/bet src/widgets/bet-history src/pages/auction-bets
git commit -m "feat: add bid history"
```

## Task 9: Place-bid feature and cross-application synchronisation

**Files:**

- Create: `src/shared/lib/decimal/decimal-step.ts`
- Create: `src/shared/lib/decimal/decimal-step.test.ts`
- Create: `src/features/set-bet/model/set-bet.schema.ts`
- Create: `src/features/set-bet/model/set-bet.schema.test.ts`
- Create: `src/features/set-bet/api/set-bet.mutation.ts`
- Create: `src/features/set-bet/ui/set-bet-form.component.tsx`
- Create: `src/features/set-bet/ui/set-bet-unavailable.component.tsx`
- Create: `src/pages/auction-bet/auction-bet.feature.integration.test.tsx`

**Step 1: Write failing decimal and schema tests**

Cover:

- Required and positive.
- Nullable min/max/step.
- Exact min/max boundaries.
- Decimal step without floating-point modulo errors.
- Step relative to available price, falling back to min.

**Step 2: Write the critical failing feature integration**

From a direct `/bet` URL:

1. Load detail and form.
2. Enter a valid price.
3. Submit real mutation.
4. Observe success toast.
5. Navigate to detail: current price and own bid changed.
6. Navigate to bets: new bid and rank exist.
7. Navigate to list: card price/status/action changed.

Add cases for client-invalid price, server 422, preserved value, and `can_set_bet: false`.

**Step 3: Verify red**

```powershell
powershell -Command "npm test -- src/shared/lib/decimal src/features/set-bet src/pages/auction-bet/auction-bet.feature.integration.test.tsx"
```

**Step 4: Implement form and mutation**

On success await invalidation of:

```ts
await Promise.all([
  queryClient.invalidateQueries({ queryKey: auctionKeys.lists() }),
  queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionUuid) }),
  queryClient.invalidateQueries({ queryKey: betKeys.byAuction(auctionUuid) }),
]);
```

Map server field errors through `setError`; keep entered values.

**Step 5: Verify cross-feature behavior**

```powershell
powershell -Command "npm test -- src/shared/lib/decimal src/features/set-bet src/pages/auction-bet/auction-bet.feature.integration.test.tsx"
```

**Step 6: Commit**

```powershell
git add src/shared/lib/decimal src/features/set-bet src/pages/auction-bet
git commit -m "feat: add auction bidding"
```

## Task 10: Shared error and recovery states

**Files:**

- Create: `src/shared/ui/error-state/error-state.component.tsx`
- Create: `src/shared/ui/not-found-state/not-found-state.component.tsx`
- Create: `src/shared/ui/toast/app-toast-provider.component.tsx`
- Create: `src/pages/error-recovery.feature.integration.test.tsx`

**Step 1: Write failing scenarios**

Cover 401, 404, 503 retry exhaustion, manual retry recovery, mutation error toast, and preserved form input.

**Step 2: Implement accessible states**

Every failure explains what happened and offers the next useful action. Use `role="alert"` only for actionable dynamic errors.

**Step 3: Verify**

```powershell
powershell -Command "npm test -- src/pages/error-recovery.feature.integration.test.tsx"
```

**Step 4: Commit**

```powershell
git add src/shared/ui src/pages/error-recovery.feature.integration.test.tsx
git commit -m "feat: add recovery states"
```

## Task 11: Responsive and accessibility design pass

**Files:**

- Modify: `src/app/styles/index.css`
- Modify: all UI files created in Tasks 4-10
- Create: `docs/verification/ui-review.md`

**Step 1: Invoke frontend-design**

Review implementation against the approved Dispatch Board system:

- Route rail remains the single signature.
- No generic KPI grid or decorative gradients.
- Manrope/IBM Plex roles remain consistent.
- Price and cargo number use tabular/mono treatment.
- One primary action per view.

**Step 2: Check widths**

Inspect at:

- 1440px desktop.
- 1024px compact desktop.
- 768px tablet.
- 390px mobile.
- 320px minimum.

**Step 3: Accessibility pass**

Verify:

- Keyboard route through filters, cards, tabs, form, and Drawer.
- Visible focus.
- Accessible names.
- Form error association.
- Sufficient contrast.
- Reduced motion.
- No information encoded by color alone.

**Step 4: Record critique**

In `docs/verification/ui-review.md`, list screenshots inspected, issues found, and corrections made.

**Step 5: Verify**

```powershell
powershell -Command "npm run lint; npm run typecheck; npm test; npm run build"
```

**Step 6: Commit**

```powershell
git add src docs/verification/ui-review.md
git commit -m "style: polish responsive UI"
```

## Task 12: Playwright critical flows

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/desktop-auction-flow.spec.ts`
- Create: `e2e/mobile-auction-flow.spec.ts`
- Create: `e2e/access-guards.spec.ts`

**Step 1: Install browser**

```powershell
powershell -Command "npx playwright install chromium"
```

**Step 2: Configure isolated projects**

Projects:

- Desktop Chromium.
- Mobile Chrome using a Pixel device profile.

Configure Vite through `webServer`, a stable base URL, trace on first retry, screenshot on failure, and no shared test state.

**Step 3: Write failing browser flows**

Desktop:

- Filter.
- Open detail.
- Place bid.
- Confirm updated detail and history.

Mobile:

- Open filter Drawer.
- Filter list.
- Use sticky action.
- Place bid.

Guards:

- Direct `/bet` unavailable.
- Direct `/bets` hidden.
- Contacts, address, cargo valuation, and place absent.

**Step 4: Run red, then fix only product defects**

```powershell
powershell -Command "npm run test:e2e"
```

Do not weaken assertions to make tests pass.

**Step 5: Commit**

```powershell
git add playwright.config.ts e2e package.json package-lock.json
git commit -m "test: add critical user flows"
```

## Task 13: Employer-facing documentation and final verification

**Files:**

- Create: `README.md`
- Create: `AI_USAGE.md`
- Modify: `.gitignore`
- Modify: `docs/verification/ui-review.md`

**Step 1: Write README**

Include:

- Product overview and screenshots.
- Setup and commands.
- Architecture and FSD boundaries.
- OpenAPI generation.
- Stateful MSW behavior.
- Route list.
- Testing strategy and scenario matrix.
- Explicit assumptions.
- Known limitations.

**Step 2: Write honest AI usage**

Include every requested section:

- AI-assisted work.
- Human decisions.
- Rejected suggestions.
- High-risk areas manually checked.
- Remaining risks.
- One-more-day improvements.

Mention that frontend-design informed the visual system, while architecture, guards, and test strategy were reviewed and approved by the candidate.

**Step 3: Run full verification**

```powershell
powershell -Command "npm run api:generate; npm run lint; npm run typecheck; npm test; npm run build; npm run test:e2e"
```

Expected: every command exits zero.

**Step 4: Check repository hygiene**

Run:

```powershell
git status --short
git diff --check
git ls-files
```

Confirm:

- PDF is absent.
- OpenAPI schema is tracked.
- No secrets, generated reports, Playwright traces, or build artifacts are tracked.
- Every component file uses `*.component.tsx`.

**Step 5: Commit**

```powershell
git add README.md AI_USAGE.md .gitignore docs/verification/ui-review.md
git commit -m "docs: prepare project handoff"
```

**Step 6: Push**

```powershell
git push origin main
```

## Final acceptance criteria

- All four routes work by direct URL.
- Required list filters and pagination use exact request contracts.
- Intent prefetch works.
- Nullable/optional/unknown DTO values do not crash UI.
- Access guards prevent hidden data from reaching components.
- Bid mutation changes list, detail, and bids through MSW plus invalidation.
- Loading, skeleton, empty, hidden, unavailable, error, and success states exist.
- Desktop and mobile layouts are usable.
- Feature integration tests cover cross-layer behavior.
- Three Playwright user flows pass.
- README and `AI_USAGE.md` are complete.
- Public `main` branch is green and employer-ready.

## Unresolved questions

None blocking.
