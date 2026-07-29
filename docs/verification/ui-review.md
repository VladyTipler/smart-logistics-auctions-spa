# Responsive and accessibility UI review

**Date:** 2026-07-29

**Direction:** approved Dispatch Board

**Method:** Chromium browser against the real Vite app and browser MSW worker, plus DOM measurements and keyboard-only walkthroughs.

## Scope

Inspected at `1440`, `1024`, `768`, `390`, and `320` px:

- auction list, desktop filters, mobile filter Drawer, and cards;
- detail page, long scroll, desktop sticky trading panel, and mobile bid dock;
- desktop table and mobile-card bid history;
- available and unavailable bid routes;
- success toast, network error, and 404 recovery states.

The review preserved the approved visual system: Snow Field/Freight Ink palette, Manrope/IBM Plex Sans/IBM Plex Mono roles, one route-rail signature, and one orange primary action per view. No gradients, KPI tiles, extra card chrome, or new decorative motif were introduced.

## Findings and corrections

| Finding | Evidence | Correction |
| --- | --- | --- |
| Supporting text failed normal-text contrast | Ink at 42–62% measured `2.53:1`–`4.44:1` on Snow Field | Raised small/supporting text to 64% ink: `4.77:1` on Snow Field and `4.90:1` on white |
| Several pointer targets were below 44 px | brand `36–41` px high; Drawer close `40×40`; combobox controls `28×32`; toast close `32×32`; back links about `19` px high | Set all to at least `44` px without increasing surrounding chrome |
| Pagination and popup options were below 44 px | pagination `40×40`; Select/Combobox options `36` px high | Raised interactive pagination boxes and every popup option to `44` px |
| White copy on Signal Orange did not reach normal-text contrast | measured `3.09:1` | All orange CTAs now use Freight Ink at `5.19:1`; hover keeps the same pair and adds an inset Ink cue; submitting state no longer fades the control |
| Nested routes marked return links and brand as current page | browser exposed false `aria-current="page"` on detail/bet/history | Added exact active matching; section navigation remains current for all auction routes |
| Main content required repeated header tabbing | first focus previously entered the brand | Added a visible-on-focus “К содержимому” skip link |
| Focus styling was selector-specific and translucent | alpha rings did not provide a reliable non-text contrast boundary | Added a solid Route Blue focus treatment: `5.12:1` against white and `4.76:1` against Snow Field; highlighted options use a solid inset blue outline |
| Bid history route was not discoverable from detail | detail exposed only the primary bid action | Added a guarded secondary “Протокол торгов” link; hidden-history policy removes it |

Regression coverage now asserts the visible/hidden protocol link and prevents false current-page state on the detail return link. Existing announcement tests remain authoritative: client validation is the inline alert; server/network failures keep a visible described error and use the polite toast as the only live channel.

## Browser evidence

- No horizontal overflow at any inspected viewport (`scrollWidth === clientWidth`).
- Desktop filters switch to the mobile trigger at 768 px.
- Desktop trading panel is sticky; at 768 px and below it becomes static with a fixed bottom action.
- Drawer fits `320×700`, opens with focus on Close, cycles through all fields/actions, and restores focus on close.
- Mobile list tab route: skip link → brand → navigation → filters → auction actions. Every focused control exposed a solid 3 px outline.
- Reduced-motion emulation produced `0.01 ms` Drawer transition/animation duration.
- Toast live region remains `aria-live="polite"`; its close button measures `44×44`.
- At 390 and 320 px, list, detail, bid, and recovery orange CTAs computed to Freight Ink on Signal Orange; solid blue focus rings remained outside the controls without clipping.
- At 390 and 320 px, pagination measured `44×44`, popup options measured `44` px high, and both Select and Combobox popups remained inside the viewport.
- Orange CTA hover keeps `5.19:1` text contrast and adds a 2 px inset Ink cue. The temporary submitting state keeps opacity `1`.
- Bid field keeps its hint and visible error IDs in `aria-describedby`.
- Statuses always include text; route/bid state is not conveyed by color alone.
- Cargo numbers, dates, route measurements, and prices keep IBM Plex Mono with tabular numerals.

## Selected screenshots

- [Desktop list](screenshots/list-1440.png)
- [320 px list](screenshots/list-320.png)
- [320 px filter Drawer](screenshots/drawer-320.png)
- [320 px detail and mobile bid dock](screenshots/detail-320.png)
- [320 px bid history](screenshots/history-320.png)
- [320 px available bid form](screenshots/bet-available-320.png)
- [320 px unavailable bid state](screenshots/bet-unavailable-320.png)
- [390 px network error](screenshots/error-network-390.png)
- [390 px 404](screenshots/404-390.png)
- [390 px success toast](screenshots/toast-success-390.png)

## Residual caveats

- This pass used Chromium and viewport emulation, not physical iOS Safari or Android devices.
- The project does not include an automated accessibility scanner; semantic roles, computed styles, focus order, focus trapping, live regions, and overflow were inspected directly and are backed by feature tests where behavior can regress.
