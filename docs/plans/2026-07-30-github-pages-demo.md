# GitHub Pages Demo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish a functional GitHub Pages demo with hash routing and demo-only stateful MSW without weakening the normal production build.

**Architecture:** One runtime config derives mock/history behavior from Vite mode and base URL. `demo` builds to `dist-demo` under the repository base path, includes the MSW worker, and is deployed by GitHub Actions; normal production stays backend-facing and MSW-free.

**Tech Stack:** React 19, TanStack Router, Vite 8, MSW 2, Vitest, Node test runner, Playwright, GitHub Actions/Pages.

---

### Task 1: Runtime mode and hash history

**Files:**
- Create: `src/shared/config/runtime-config.ts`
- Test: `src/shared/config/runtime-config.test.ts`
- Modify: `src/main.tsx`
- Modify: `src/app/bootstrap.ts`
- Modify: `src/main.integration.test.tsx`
- Modify: `src/app/router/router.ts`

**Steps:**

1. RED: test that `demo` enables mock API, builds the worker URL from `/smart-logistics-auctions-spa/`, and selects hash history; production disables mocks.
2. Run `powershell -Command "npx vitest run src/shared/config/runtime-config.test.ts src/main.integration.test.tsx"`; expect failure.
3. Implement one runtime config, rename bootstrap's `isDevelopment` gate to behavior-based `shouldStartWorker`, pass `serviceWorker.url`, and use `createHashHistory()` only for demo.
4. Re-run focused tests; expect green.
5. Commit `feat: add Pages demo runtime`.

### Task 2: Demo build and artifact contract

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `scripts/verify-demo-artifacts.mjs`
- Create: `scripts/verify-demo-artifacts.test.mjs`

**Steps:**

1. RED: Node fixtures must reject missing worker, wrong repository base, missing MSW bundle evidence, and accept a valid demo artifact.
2. Run `powershell -Command "node --test scripts/verify-demo-artifacts.test.mjs"`; expect failure.
3. Add `build:demo`, `dist-demo`, demo `base/publicDir/outDir`, and a verifier requiring the repository base, `mockServiceWorker.js`, MSW browser code, and four manifest-reachable lazy route chunks.
4. Include all artifact tests in `npm test`; run focused tests plus `npm run build` and `npm run build:demo`.
5. Confirm normal `dist` still rejects MSW while `dist-demo` requires it.
6. Commit `build: add isolated Pages demo`.

### Task 3: Browser proof for published topology

**Files:**
- Create: `playwright.demo.config.ts`
- Create: `e2e/pages-demo.spec.ts`
- Modify: `package.json`

**Steps:**

1. RED: Pages smoke opens the repository subpath/hash route, requires auction data, navigates to detail, reloads, and keeps the route/data functional.
2. Run `powershell -Command "npm run test:e2e:demo"` before demo wiring is complete; expect failure.
3. Serve `dist-demo` with a strict isolated preview port and deterministic base URL.
4. Re-run demo smoke; expect green without console errors or failed `/api/v1` requests.
5. Run existing Playwright 5/5 to prove the dev topology is unchanged.
6. Commit `test: verify Pages demo flow`.

### Task 4: GitHub Pages workflow and handoff

**Files:**
- Create: `.github/workflows/pages.yml`
- Create: `scripts/verify-pages-workflow.test.mjs`
- Modify: `README.md`
- Modify: `AI_USAGE.md`

**Steps:**

1. RED: structural test requires `main`/manual triggers, minimal permissions, protected `github-pages` environment, full gates, demo build/smoke, upload of `dist-demo`, and current official Pages actions.
2. Run `powershell -Command "node --test scripts/verify-pages-workflow.test.mjs"`; expect failure.
3. Add the workflow with Node 22, npm cache, Chromium install, normal/demo gates, `configure-pages@v5`, `upload-pages-artifact@v4`, and `deploy-pages@v4`.
4. Document the live URL, hash routing, demo-only MSW, and explicit non-PWA status.
5. Run all Node artifact/workflow tests; expect green.
6. Commit `ci: deploy GitHub Pages demo`.

### Task 5: Acceptance and publication

1. Run API generation; require no generated diff.
2. Run lint, typecheck, `npm test`, normal build, demo build, existing Playwright, demo Playwright, runtime audit, diff/hygiene checks.
3. Independent review: requirements, production/demo isolation, workflow permissions, direct hash reload, docs accuracy.
4. Merge to `feat/implementation`, update wiki, merge to `main`, push.
5. Enable Pages source as GitHub Actions if needed; wait for workflow and verify the public URL in a fresh browser context.

## Unresolved questions

None.
