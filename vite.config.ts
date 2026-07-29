import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export function shouldEnableMockApi(mode: string) {
  return mode === "development" || mode === "demo" || mode === "test";
}

export default defineConfig(({ command, mode }) => {
  const enableMockApi = shouldEnableMockApi(mode);

  return {
    define: {
      __ENABLE_MOCK_API__: JSON.stringify(enableMockApi),
    },
    publicDir: command === "build" ? false : "public",
    plugins: [react(), tailwindcss()],
    build: {
      manifest: true,
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
    },
  };
});
