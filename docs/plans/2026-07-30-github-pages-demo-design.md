# GitHub Pages demo design

## Goal

Publish a self-contained employer demo at:

`https://vladytipler.github.io/smart-logistics-auctions-spa/`

The Pages build must work without a backend while the normal production build
continues to exclude MSW and target a real `/api/v1`.

## Considered approaches

1. **Hash routing + demo-only MSW — approved.**
   Reliable on GitHub Pages refresh/direct links, no server rewrite hack, and
   keeps local/normal production browser-history URLs unchanged.
2. Browser-history routing with a `404.html` redirect.
   Cleaner demo URLs, but adds a redirect protocol, transient 404 behavior, and
   more path/base edge cases.
3. Publish the normal production build.
   Rejected because Pages has no `/api/v1`; the UI would load but data flows
   would fail.

## Build boundaries

- `npm run build` remains the backend-facing production build:
  `publicDir=false`, no worker, no MSW markers, exact 500,000-byte entry budget.
- `npm run build:demo` uses Vite `mode=demo`:
  - base `/smart-logistics-auctions-spa/`;
  - output `dist-demo`;
  - `public/mockServiceWorker.js` included;
  - browser MSW starts before React;
  - worker URL derives from `import.meta.env.BASE_URL`.
- Demo routing passes `createHashHistory()` to TanStack Router. Other modes
  retain the existing browser-history behavior.

## Verification

- TDD tests cover mode-derived runtime configuration and demo artifact
  invariants.
- Normal artifact tests continue proving MSW exclusion.
- A dedicated Playwright Pages smoke test serves `dist-demo` under the
  repository subpath and proves:
  - list data loads through the Service Worker;
  - hash navigation works;
  - reload/direct opening keeps the route functional.
- Existing Vitest feature integration and five Playwright critical flows stay
  unchanged.

## Deployment

GitHub Actions runs on `main` and manual dispatch:

1. install dependencies;
2. lint, typecheck, Vitest/artifact tests;
3. normal production build and existing Playwright flows;
4. demo build and Pages smoke;
5. upload `dist-demo`;
6. deploy through the protected `github-pages` environment.

Workflow permissions are limited to `contents: read`, `pages: write`, and
`id-token: write`; deployments use concurrency cancellation.

## Documentation

README links the live demo, explains hash URLs and demo-only MSW, and keeps the
normal production/API boundary explicit. This is a static SPA demo, not a PWA:
the MSW Service Worker mocks HTTP but does not provide install/offline caching.
