import { createRuntimeConfig } from "@/shared/config/runtime-config";

describe("runtime config", () => {
  it("enables the mock API and hash history for the Pages demo", () => {
    expect(
      createRuntimeConfig({
        mode: "demo",
        baseUrl: "/smart-logistics-auctions-spa/",
      }),
    ).toEqual({
      shouldStartWorker: true,
      serviceWorkerUrl:
        "/smart-logistics-auctions-spa/mockServiceWorker.js",
      routerHistory: "hash",
    });
  });

  it("keeps local development on the mock API and browser history", () => {
    expect(
      createRuntimeConfig({
        mode: "development",
        baseUrl: "/",
      }),
    ).toEqual({
      shouldStartWorker: true,
      serviceWorkerUrl: "/mockServiceWorker.js",
      routerHistory: "browser",
    });
  });

  it("disables the mock API in production", () => {
    expect(
      createRuntimeConfig({
        mode: "production",
        baseUrl: "/",
      }),
    ).toMatchObject({
      shouldStartWorker: false,
      serviceWorkerUrl: "",
      routerHistory: "browser",
    });
  });
});
