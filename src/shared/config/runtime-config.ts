type RuntimeConfigInput = {
  mode: string;
  baseUrl: string;
};

type RouterHistoryMode = "browser" | "hash";

export type RuntimeConfig = {
  shouldStartWorker: boolean;
  serviceWorkerUrl: string;
  routerHistory: RouterHistoryMode;
};

export function createRuntimeConfig({
  mode,
  baseUrl,
}: RuntimeConfigInput): RuntimeConfig {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const shouldStartWorker = mode === "development" || mode === "demo";

  return {
    shouldStartWorker,
    serviceWorkerUrl: shouldStartWorker
      ? `${normalizedBaseUrl}mockServiceWorker.js`
      : "",
    routerHistory: mode === "demo" ? "hash" : "browser",
  };
}

export const runtimeConfig =
  import.meta.env.MODE === "production"
    ? ({
        shouldStartWorker: false,
        serviceWorkerUrl: "",
        routerHistory: "browser",
      } satisfies RuntimeConfig)
    : createRuntimeConfig({
        mode: import.meta.env.MODE,
        baseUrl: import.meta.env.BASE_URL,
      });
