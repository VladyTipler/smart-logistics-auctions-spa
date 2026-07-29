import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import {
  appRouter,
  type AppRouter,
} from "@/app/router/router";
import { appQueryClient } from "@/app/providers/query-client";

type AppProvidersProps = {
  queryClient?: QueryClient;
  router?: AppRouter;
};

export function AppProviders({
  queryClient = appQueryClient,
  router = appRouter,
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
