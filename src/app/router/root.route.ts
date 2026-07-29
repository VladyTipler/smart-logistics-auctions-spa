import { createRootRoute } from "@tanstack/react-router";

import { RouteOutlet } from "@/app/layout/app-shell.component";
import { NotFoundPage } from "@/app/router/not-found-page.component";

export const rootRoute = createRootRoute({
  component: RouteOutlet,
  notFoundComponent: NotFoundPage,
});
