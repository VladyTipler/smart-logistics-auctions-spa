import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export function shouldEnableMockApi(mode: string) {
  return mode === "development" || mode === "demo" || mode === "test";
}

export default defineConfig(({ command, mode }) => {
  const enableMockApi = shouldEnableMockApi(mode);
  const isDemo = mode === "demo";

  return {
    ...(isDemo ? { base: "/smart-logistics-auctions-spa/" } : {}),
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
    },
  };
});
