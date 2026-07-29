# Auctions SPA Design

**Date:** 2026-07-29
**Status:** Approved

## Goal

Build a polished React SPA for cargo auctions that demonstrates contract accuracy, coherent state transitions, accessible responsive UI, and feature-level testing.

The primary user is a carrier dispatcher. Their main job is to compare route, schedule, cargo, and price quickly, then place a valid bid with confidence.

## Scope

Routes:

- `/auctions` - paginated list with URL-synchronised filters.
- `/auctions/$auctionUuid` - auction detail.
- `/auctions/$auctionUuid/bets` - bid history.
- `/auctions/$auctionUuid/bet` - directly linkable bid form.

Required stack:

- React, TypeScript, Vite.
- TanStack Router and TanStack Query.
- React Hook Form and Zod.
- MSW with a mutable in-memory store.
- Feature-Sliced Design.
- Zustand only for local UI state.
- Tailwind CSS, Base UI, Lucide Icons.

Every file that defines a React component uses the `*.component.tsx` suffix. Route configuration files do not define inline components.

## Visual direction

The approved direction is **Dispatch Board**: a light, operational logistics interface with high information density and one domain-specific signature.

### Tokens

- Snow Field `#F4F7F8` - application background.
- Freight Ink `#15232D` - primary text.
- Route Blue `#1E5EFF` - navigation and route structure.
- Signal Orange `#F06A2A` - bid actions and urgent emphasis.
- Status Teal `#087F6B` - leading and successful states.
- Steel `#D8E0E5` - borders and secondary structure.

Typography:

- Manrope - headings.
- IBM Plex Sans - interface copy.
- IBM Plex Mono - cargo numbers, prices, dates, and technical values.

### Signature

A continuous route rail represents the shipment:

- Horizontal load-to-unload rail in list cards.
- Vertical multi-point timeline in detail.
- The rail connects route, schedule, trading status, and price instead of acting as decoration.

Motion is limited to route hover feedback, Drawer transitions, and toasts. Reduced motion is respected.

The design intentionally avoids generic dashboard KPI cards, gradients, and default shadcn styling. The route rail is the single visual risk; surrounding UI remains restrained.

## Responsive composition

### Auction list

- Compact header with result count.
- Desktop filter rail; mobile Base UI Drawer.
- Auction cards containing route, schedule, cargo, trading state, price, and primary action.
- Pagination.
- Dedicated skeleton, empty, and error states.
- Detail prefetch on link intent or hover.

### Auction detail

- Cargo number, auction type, and statuses.
- Vertical route with every point.
- Cargo and vehicle requirements.
- Organizer, contacts, and payment sections.
- Sticky desktop trading panel with current/available price, min/max/step, and user's bid.
- Mobile sticky primary action.

### Bid history

- Semantic table on desktop and cards on mobile.
- Participant identity, VAT/no-VAT prices, rank, winner state, cancellation state and reason.
- Separate empty and hidden-history states.

### Bid form

- Auction context and available price.
- One primary price field.
- Min/max/step guidance.
- Accessible inline validation.
- Direct links remain useful when bidding is unavailable: show an explicit restricted state instead of redirecting.

## Architecture

Feature-Sliced Design layers:

- `app` - providers, router, QueryClient, MSW bootstrap.
- `pages` - route composition.
- `widgets` - auction list, detail sections, trading panel, bid history.
- `features` - filters, pagination, set bid.
- `entities/auction` and `entities/bet` - API, query options, mappers, access policy, UI.
- `shared` - typed API client, Base UI wrappers, tokens, formatters, error mapping, test utilities.

State ownership:

- TanStack Query owns server state.
- TanStack Router search params own filters and pagination.
- Zustand owns only local UI state such as the mobile filter Drawer.
- The MSW store is private to mock handlers and tests.
- UI never imports the MSW store.

OpenAPI is the contract source of truth. TypeScript DTOs are generated from `openapi.auctions.v0.json`. ViewModel mappers convert optional and nullable DTO data into explicit UI states.

Central query options and key factories cover:

- Auction lists by request payload.
- Auction detail by UUID.
- Bid history by UUID and `all`.

## Data flow

Read flow:

1. Router validates search params with Zod safe fallbacks.
2. Page requests central TanStack Query options.
3. Typed API client performs HTTP requests.
4. MSW handler reads the shared mock store.
5. DTO is mapped to a ViewModel and rendered.

Bid flow:

1. Direct bid route loads auction detail.
2. Access policy determines whether the form is available.
3. React Hook Form and Zod validate price.
4. Typed client posts `SetBetRequest`.
5. MSW validates the request and mutates the shared store.
6. Store updates list price, detail price, user's bid/status, and bid history/rank.
7. Endpoint returns an empty successful `200`, matching the unspecified OpenAPI response body.
8. Mutation invalidates list, detail, and bids queries.
9. Refetched HTTP responses synchronise every screen.

No optimistic update is required. The stateful mock plus invalidation is the behavior explicitly requested by the assignment.

## Access policy

All visibility and capability rules are centralised in a pure `getAuctionAccess` policy:

- `canPlaceBet`
- `canViewBets`
- `canViewContacts`
- `canViewAddresses`
- `canViewCargoPrice`
- `canViewPlaces`

Rules:

- `can_set_bet: false` disables the form and prevents POST.
- Either root or nested `hide_bets_history: true` hides history and prevents its query.
- `hide_points_address_and_contacts: true` preserves cities but removes exact addresses and contacts.
- `no_view_cargo_price: true` hides cargo valuation, not trading prices.
- `hide_places: true` hides bid rank without hiding bid history.

ViewModel mappers remove restricted data before components receive it. MSW repeats critical checks so direct HTTP calls cannot bypass the UI:

- Forbidden bids return a contract-shaped `422 ValidationProblem` with `code: "bet_not_allowed"`.
- Hidden bid history returns an empty contract-shaped response without exposing fixtures.

## OpenAPI decisions

- Base URL is `/api/v1/`.
- List navigation uses `main.order_uid` as `auctionUuid`.
- `status` is a string array of user trading statuses.
- `statuses` is an integer array of auction statuses.
- `auc_type` is a string array.
- Price filters map to `current_price_from` and `current_price_to`.
- Date filters are serialised as ISO 8601 values with an offset.
- Bid history requests use `all=true` so cancelled bids can be displayed.
- Participant count is the number of unique `subscriber_id` values.
- Label mapping supports the union of list and detail trading statuses plus an unknown fallback.
- Authentication is outside scope because the schema declares 401 responses but no security scheme.
- The city selector uses a local mock dictionary because the schema has no city endpoint.
- Bid step validation is implemented with decimal-safe arithmetic and documented relative to the available price or minimum boundary.

## Error handling

A shared API error mapper handles:

- `401` - session unavailable state; no authentication implementation.
- `404` - auction not found with navigation back to the list.
- `422` - map `ValidationProblem.errors` to React Hook Form where possible, plus general toast.
- `503` and network failures - actionable error state with retry.

Queries do not retry 4xx responses. A 503 may retry once. Failed mutations preserve entered form values.

Empty, hidden, unavailable, and failed states remain distinct because they require different user actions.

## Testing strategy

Confidence comes primarily from feature integration and browser flows, not isolated units.

### Feature integration

Vitest, React Testing Library, user-event, and MSW Node render the application with real:

- TanStack Router.
- QueryClient.
- Zustand store.
- API client.
- MSW handlers and resettable mutable store.

Router, Query, API functions, and feature components are not mocked.

Required scenarios:

1. List loads cards and pagination.
2. Filters update the URL, produce the correct POST body, and change results.
3. Hover intent prefetches detail and navigation renders it.
4. A direct `/bet` link loads detail and evaluates access.
5. Successful bid updates list, detail, and history after invalidation.
6. Client validation prevents an invalid request.
7. Server 422 maps to the field and preserves the value.
8. Hidden history prevents the bids request.
9. Guards remove contacts, addresses, cargo valuation, and ranking.
10. 503 reaches an error state and a manual retry recovers.

### Browser E2E

Playwright runs against the real Vite app and browser Service Worker:

- Desktop: filter, detail, bid, history.
- Mobile: filter Drawer, card, sticky bid action, bid.
- Direct routes and hidden-data guards.

Run Chromium desktop and one mobile viewport. Use role-based locators and web-first assertions.

### Unit tests

Unit tests cover only dense pure logic:

- Search param schema.
- List request builder.
- Access policy.
- DTO-to-ViewModel mappers.
- Bid validation and decimal step arithmetic.

## Documentation and delivery

- README: setup, scripts, architecture, assumptions, verification matrix, remaining limitations.
- `AI_USAGE.md`: AI contributions, human decisions, rejected suggestions, high-risk checks, residual risks, and one-day improvements.
- Repository includes the supplied OpenAPI schema and assignment PDF.

## References

- TanStack Router search params and preloading.
- TanStack Query v5 invalidation.
- MSW request handlers and response timing.
- Base UI v1.6 integration with Tailwind and React Hook Form.
- Testing Library user-centred integration testing.
- Playwright v1.61 isolated browser projects and web-first assertions.

## Open questions

None blocking. Implementation must keep the documented step-boundary and participant-count assumptions visible in README.
