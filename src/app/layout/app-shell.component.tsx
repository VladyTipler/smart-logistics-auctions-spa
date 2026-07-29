import { Link, Outlet } from "@tanstack/react-router";

export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        К содержимому
      </a>
      <header className="app-header">
        <Link
          className="brand"
          to="/auctions"
          activeOptions={{ exact: true }}
          aria-label="Умная Логистика"
        >
          <span className="brand__mark" aria-hidden="true">
            УЛ
          </span>
          <span>
            <span className="brand__name">Умная Логистика</span>
            <span className="brand__descriptor">Диспетчерская перевозчика</span>
          </span>
        </Link>

        <nav className="app-navigation" aria-label="Основная навигация">
          <Link
            className="app-navigation__link"
            to="/auctions"
            activeOptions={{ exact: false }}
            activeProps={{ "aria-current": "page" }}
            resetScroll={false}
          >
            Аукционы
          </Link>
        </nav>
      </header>

      <main className="app-main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
