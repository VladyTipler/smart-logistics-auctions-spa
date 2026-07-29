import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@/app/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/app.component";

async function enableMocking() {
  if (!import.meta.env.DEV) {
    return;
  }

  const { setupWorker } = await import("msw/browser");
  await setupWorker().start({ onUnhandledRequest: "bypass" });
}

async function bootstrap() {
  await enableMocking();

  const rootElement = document.querySelector("#root");

  if (!rootElement) {
    throw new Error("Application root element was not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
