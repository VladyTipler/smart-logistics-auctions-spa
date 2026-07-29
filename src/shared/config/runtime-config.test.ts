import { createRuntimeConfig } from "@/shared/config/runtime-config";
import { shouldEnableMockApi } from "../../../vite.config";

describe("runtime config", () => {
  it("enables the mock API and hash history for the Pages demo", () => {
    expect(
      createRuntimeConfig({
        mode: "demo",
        baseUrl: "/smart-logistics-auctions-spa/",
        shouldStartWorker: true,
        serviceWorkerFileName: "mockServiceWorker.js",
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
        shouldStartWorker: true,
        serviceWorkerFileName: "mockServiceWorker.js",
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
        shouldStartWorker: false,
        serviceWorkerFileName: "",
      }),
    ).toMatchObject({
      shouldStartWorker: false,
      serviceWorkerUrl: "",
      routerHistory: "browser",
    });
  });

  it.each([
    ["development", true],
    ["demo", true],
    ["test", true],
    ["production", false],
    ["staging", false],
    ["preview", false],
  ])("sets the mock API compile flag for %s mode", (mode, expected) => {
    expect(shouldEnableMockApi(mode)).toBe(expected);
  });
});
