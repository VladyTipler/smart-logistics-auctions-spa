import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";

import { AppShell } from "@/app/layout/app-shell.component";
import { NotFoundPage } from "@/app/router/not-found-page.component";

export type AppRouterContext = {
  queryClient: QueryClient;
};

export const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: AppShell,
  notFoundComponent: NotFoundPage,
});
