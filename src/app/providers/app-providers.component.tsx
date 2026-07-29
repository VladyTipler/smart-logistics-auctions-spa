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
  queryClient = appQueryClient,
  router,
}: AppProvidersProps) {
  const resolvedRouter = useMemo(
    () =>
      router ??
      (queryClient === appQueryClient
        ? appRouter
        : createAppRouter({ queryClient })),
    [queryClient, router],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={resolvedRouter} />
    </QueryClientProvider>
  );
}
