import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory } from "@tanstack/react-router";
import { configure, render } from "@testing-library/react";

import { AppProviders } from "@/app/providers/app-providers.component";
import { createAppRouter } from "@/app/router/router";

// Route components stay genuinely lazy; cold parallel transforms can exceed
// Testing Library's short default without indicating an application failure.
configure({ asyncUtilTimeout: 10_000 });

const originalScrollTo = window.scrollTo;

afterEach(() => {
  window.scrollTo = originalScrollTo;
});

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
    queryClient,
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
