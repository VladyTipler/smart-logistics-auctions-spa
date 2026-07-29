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

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Application root element was not found");
}

const root = createRoot(rootElement);

void bootstrapApplication({
  isDevelopment: import.meta.env.DEV,
  startWorker: async () => {
    const { setupWorker } = await import("msw/browser");
    const worker = setupWorker();

    await worker.start({
      onUnhandledRequest: createUnhandledRequestPolicy(window.location.origin),
    });
  },
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
});
