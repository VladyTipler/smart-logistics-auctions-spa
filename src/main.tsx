import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@/app/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/app.component";
import {
  bootstrapApplication,
  createUnhandledRequestPolicy,
} from "@/app/bootstrap";
import { StartupError } from "@/app/startup-error.component";
import { runtimeConfig } from "@/shared/config/runtime-config";

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Application root element was not found");
}

const root = createRoot(rootElement);

const renderApplication = {
  renderApp: () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  },
  renderStartupError: () => {
    root.render(
      <StrictMode>
        <StartupError />
      </StrictMode>,
    );
  },
};

const startWorker =
  __ENABLE_MOCK_API__
    ? async () => {
        const { worker } = await import("@/shared/api/mocks/browser");

        await worker.start({
          onUnhandledRequest: createUnhandledRequestPolicy(
            window.location.origin,
          ),
          serviceWorker: {
            url: runtimeConfig.serviceWorkerUrl,
          },
        });
      }
    : () => Promise.resolve();

void bootstrapApplication({
  ...renderApplication,
  shouldStartWorker: runtimeConfig.shouldStartWorker,
  startWorker,
});
