import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  appRouter,
  createAppRouter,
  type AppRouter,
} from "@/app/router/router";
import { appQueryClient } from "@/app/providers/query-client";

type AppProvidersProps = {
  queryClient?: QueryClient;
  router?: AppRouter;
};

export function AppProviders({
  queryClient,
  router,
}: AppProvidersProps) {
  const routerQueryClient = router?.options.context.queryClient;
  if (
    queryClient &&
    routerQueryClient &&
    queryClient !== routerQueryClient
  ) {
    throw new Error(
      "Router and QueryClientProvider must share one QueryClient",
    );
  }

  const providerClient =
    queryClient ?? routerQueryClient ?? appQueryClient;
  const resolvedRouter = useMemo(
    () =>
      router ??
      (providerClient === appQueryClient
        ? appRouter
        : createAppRouter({ queryClient: providerClient })),
    [providerClient, router],
  );

  return (
    <QueryClientProvider client={providerClient}>
      <RouterProvider router={resolvedRouter} />
    </QueryClientProvider>
  );
}
