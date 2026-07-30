import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath, URL } from "node:url";
import test from "node:test";

import { routeSourceModules } from "./artifact-verifier-core.mjs";

const execFileAsync = promisify(execFile);
const verifierCoreSource = fileURLToPath(
  new URL("./artifact-verifier-core.mjs", import.meta.url),
);
const verifierSource = fileURLToPath(
  new URL("./verify-production-artifacts.mjs", import.meta.url),
);
const legacyRouteFiles = [
  "assets/auction-list-page.component-a.js",
  "assets/auction-detail-page.component-b.js",
  "assets/auction-bets-page.component-c.js",
  "assets/auction-bet-page.component-d.js",
];

async function createFixture({
  entryDynamicImports = routeSourceModules,
  entrySize = 100,
  extraFiles = {},
  routeFiles = legacyRouteFiles,
} = {}) {
  const fixtureRoot = await mkdtemp(
    path.join(tmpdir(), "production-artifacts-"),
  );
  const scriptsDirectory = path.join(fixtureRoot, "scripts");
  const distDirectory = path.join(fixtureRoot, "dist");
  const assetsDirectory = path.join(distDirectory, "assets");
  const manifestDirectory = path.join(distDirectory, ".vite");
  const entryFile = "assets/index-entry.js";

  await mkdir(scriptsDirectory, { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  await mkdir(manifestDirectory, { recursive: true });
  await copyFile(
    verifierSource,
    path.join(scriptsDirectory, "verify-production-artifacts.mjs"),
  );
  await copyFile(
    verifierCoreSource,
    path.join(scriptsDirectory, "artifact-verifier-core.mjs"),
  );
  await writeFile(
    path.join(distDirectory, "index.html"),
    `<script type="module" src="/${entryFile}"></script>`,
  );
  await writeFile(path.join(distDirectory, entryFile), "x".repeat(entrySize));

  const manifest = {
    "src/main.tsx": {
      file: entryFile,
      src: "src/main.tsx",
      isEntry: true,
      dynamicImports: entryDynamicImports,
    },
  };

  for (const [index, source] of routeSourceModules.entries()) {
    const file = routeFiles[index];
    manifest[source] = {
      file,
      src: source,
      isDynamicEntry: true,
    };
    await writeFile(path.join(distDirectory, file), `route ${index}`);
  }

  for (const [file, source] of Object.entries(extraFiles)) {
    const filePath = path.join(distDirectory, file);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, source);
  }

  await writeFile(
    path.join(manifestDirectory, "manifest.json"),
    JSON.stringify(manifest),
  );

  return fixtureRoot;
}

async function runVerifier(fixtureRoot) {
  try {
    const result = await execFileAsync(
      process.execPath,
      [path.join(fixtureRoot, "scripts", "verify-production-artifacts.mjs")],
      { cwd: fixtureRoot },
    );

    return { status: 0, stderr: result.stderr, stdout: result.stdout };
  } catch (error) {
    return {
      status: error.code,
      stderr: error.stderr ?? "",
      stdout: error.stdout ?? "",
    };
  }
}

async function withFixture(options, assertion) {
  const fixtureRoot = await createFixture(options);

  try {
    await assertion(await runVerifier(fixtureRoot));
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

test("rejects an entry chunk of 500001 bytes", async () => {
  await withFixture({ entrySize: 500_001 }, ({ status, stderr, stdout }) => {
    assert.notEqual(status, 0, stdout);
    assert.match(stderr, /500001 bytes; expected at most 500000 bytes/);
  });
});

test("accepts an entry chunk of exactly 500000 bytes", async () => {
  await withFixture({ entrySize: 500_000 }, ({ status, stderr }) => {
    assert.equal(status, 0, stderr);
  });
});

test("accepts a legitimate browser-prefixed application chunk", async () => {
  await withFixture(
    { extraFiles: { "assets/browser-observability.js": "application code" } },
    ({ status, stderr }) => {
      assert.equal(status, 0, stderr);
    },
  );
});

test("uses manifest source modules instead of output-name prefixes", async () => {
  await withFixture(
    {
      routeFiles: [
        "assets/route-a.js",
        "assets/route-b.js",
        "assets/route-c.js",
        "assets/route-d.js",
      ],
    },
    ({ status, stderr }) => {
      assert.equal(status, 0, stderr);
    },
  );
});

test("rejects an orphan dynamic route chunk", async () => {
  await withFixture(
    { entryDynamicImports: routeSourceModules.slice(0, -1) },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /route source "src\/pages\/auction-bet\/auction-bet-page\.component\.tsx" is not dynamically reachable from manifest entry "src\/main\.tsx"/i,
      );
    },
  );
});

test("rejects the exact MSW service worker artifact", async () => {
  await withFixture(
    { extraFiles: { "mockServiceWorker.js": "service worker" } },
    ({ status, stderr }) => {
      assert.notEqual(status, 0);
      assert.match(stderr, /MSW browser artifact: mockServiceWorker\.js/);
    },
  );
});

test("rejects bundled MSW browser markers", async () => {
  await withFixture(
    { extraFiles: { "assets/vendor.js": 'import "msw/browser";' } },
    ({ status, stderr }) => {
      assert.notEqual(status, 0);
      assert.match(stderr, /forbidden MSW marker "msw\/browser"/);
    },
  );
});
