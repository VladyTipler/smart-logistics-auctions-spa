import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { PAGES_REPOSITORY_BASE_PATH } from "./pages.config";

type MockApiContext = {
  command: "build" | "serve";
  mode: string;
};

export function shouldEnableMockApi({ command, mode }: MockApiContext) {
  if (mode === "demo") {
    return command === "build" || command === "serve";
  }

  return command === "serve" && (mode === "development" || mode === "test");
}

export default defineConfig(({ command, mode }) => {
  const enableMockApi = shouldEnableMockApi({ command, mode });
  const isDemo = mode === "demo";

  return {
    ...(isDemo ? { base: PAGES_REPOSITORY_BASE_PATH } : {}),
    define: {
      __ENABLE_MOCK_API__: JSON.stringify(enableMockApi),
    },
    publicDir: command === "build" && !isDemo ? false : "public",
    plugins: [react(), tailwindcss()],
    build: {
      manifest: true,
      ...(isDemo ? { outDir: "dist-demo" } : {}),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      dir: "./src",
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/shared/config/test/setup-tests.ts"],
      testTimeout: 10_000,
    },
  };
});
