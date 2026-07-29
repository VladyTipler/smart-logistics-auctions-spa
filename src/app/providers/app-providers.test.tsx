import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createAppRouter } from "@/app/router/router";

import { AppProviders } from "./app-providers.component";

describe("AppProviders", () => {
  it("rejects a router and provider configured with different QueryClient instances", () => {
    const routerClient = new QueryClient();
    const providerClient = new QueryClient();
    const router = createAppRouter({
      history: createMemoryHistory({ initialEntries: ["/missing"] }),
      queryClient: routerClient,
    });

    expect(() =>
      render(
        <AppProviders router={router} queryClient={providerClient} />,
      ),
    ).toThrow("Router and QueryClientProvider must share one QueryClient");
  });
});
