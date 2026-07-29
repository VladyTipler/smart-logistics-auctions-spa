import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/auctions" aria-label="Умная Логистика">
          <span className="brand__mark" aria-hidden="true">
            УЛ
          </span>
          <span>
            <span className="brand__name">Умная Логистика</span>
            <span className="brand__descriptor">Диспетчерская перевозчика</span>
          </span>
        </a>

        <nav className="app-navigation" aria-label="Основная навигация">
          <a className="app-navigation__link" href="/auctions">
            Аукционы
          </a>
        </nav>
      </header>

      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  );
}

export function RouteOutlet() {
  return <Outlet />;
}
