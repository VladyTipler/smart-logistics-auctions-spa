import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory } from "@tanstack/react-router";
import { render } from "@testing-library/react";

import { AppProviders } from "@/app/providers/app-providers.component";
import { createAppRouter } from "@/app/router/router";

export function renderApp(initialUrl = "/auctions") {
  window.scrollTo = () => undefined;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
  const result = render(
    <AppProviders queryClient={queryClient} router={router} />,
  );

  return {
    ...result,
    queryClient,
    router,
  };
}
