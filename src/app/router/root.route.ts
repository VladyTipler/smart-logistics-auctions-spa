import { createRootRoute } from "@tanstack/react-router";

import { AppShell } from "@/app/layout/app-shell.component";
import { NotFoundPage } from "@/app/router/not-found-page.component";

export const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
});
