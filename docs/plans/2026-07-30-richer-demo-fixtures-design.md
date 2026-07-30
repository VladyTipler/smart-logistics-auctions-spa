# Richer demo fixtures design

## Goal

Make the public auction list feel like a real dispatcher queue without changing
the approved Dispatch Board UI.

## Decision

Extend the existing explicit `AuctionSeed[]` from 5 to 18 records and keep the
current seed-to-contract factory. Do not use generated loops or random data.

## Dataset

- Preserve `SL-1001` through `SL-1005`, their UUIDs, guards, and E2E behavior.
- Add `SL-1006` through `SL-1018`.
- Show 10 cards on the default first page and 8 on the second.
- Vary routes, dates, cargo names, weight, volume, body types, prices, auction
  types, participation states, and bid availability.
- Extend the production-local city option source so every fixture route remains
  filterable.
- Keep every record deterministic and OpenAPI-shaped.

## Boundaries

- No layout, token, typography, or decorative UI changes.
- The route rail remains the only visual signature.
- Stateful bidding and reset behavior remain unchanged.
- Normal production continues to exclude MSW; only development, tests, and the
  Pages demo consume these fixtures.

## Verification

- Backend integration: exact total, default page size, second-page size/order,
  filtering, and deterministic reset.
- Feature integration: Router -> HTTP -> MSW -> Query -> UI proves `18 -> 10 +
  8` through semantic pagination.
- Browser flows keep stable first-auction selectors and expect `Найдено: 18`.
- Run focused tests, full tests, lint, typecheck, production build, normal E2E,
  and Pages E2E.
