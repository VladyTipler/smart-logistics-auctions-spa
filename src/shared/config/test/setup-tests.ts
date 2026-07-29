import "@testing-library/jest-dom/vitest";

// Keep feature tests focused on route/data behavior. Production chunk boundaries
// are covered separately by the router source regression and build verifier.
import "@/pages/auction-bet/auction-bet-page.component";
import "@/pages/auction-bets/auction-bets-page.component";
import "@/pages/auction-detail/auction-detail-page.component";
import "@/pages/auction-list/auction-list-page.component";
