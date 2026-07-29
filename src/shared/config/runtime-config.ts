type RuntimeConfigInput = {
  mode: string;
  baseUrl: string;
  shouldStartWorker: boolean;
  serviceWorkerFileName: string;
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
  shouldStartWorker,
  serviceWorkerFileName,
}: RuntimeConfigInput): RuntimeConfig {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    shouldStartWorker,
    serviceWorkerUrl: shouldStartWorker
      ? `${normalizedBaseUrl}${serviceWorkerFileName}`
      : "",
    routerHistory: mode === "demo" ? "hash" : "browser",
  };
}

const serviceWorkerFileName = __ENABLE_MOCK_API__
  ? "mockServiceWorker.js"
  : "";

export const runtimeConfig = createRuntimeConfig({
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL,
  shouldStartWorker: __ENABLE_MOCK_API__,
  serviceWorkerFileName,
});
