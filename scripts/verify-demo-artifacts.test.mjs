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

const execFileAsync = promisify(execFile);
const verifierSource = fileURLToPath(
  new URL("./verify-demo-artifacts.mjs", import.meta.url),
);
const repositoryBase = "/smart-logistics-auctions-spa/";
const mswBrowserSource = "src/shared/api/mocks/browser.ts";
const routeSources = [
  "src/pages/auction-list/auction-list-page.component.tsx",
  "src/pages/auction-detail/auction-detail-page.component.tsx",
  "src/pages/auction-bets/auction-bets-page.component.tsx",
  "src/pages/auction-bet/auction-bet-page.component.tsx",
];

async function createFixture({
  baseUrl = repositoryBase,
  includeWorker = true,
  entryDynamicImports = [mswBrowserSource, ...routeSources],
  entryImports = [],
  includeMswBrowserEntry = true,
  mswBrowserIsDynamicEntry = true,
  nonDynamicRouteSource,
  omittedRouteSource,
  routeFiles = [
    "assets/route-a.js",
    "assets/route-b.js",
    "assets/route-c.js",
    "assets/route-d.js",
  ],
} = {}) {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "demo-artifacts-"));
  const scriptsDirectory = path.join(fixtureRoot, "scripts");
  const distDirectory = path.join(fixtureRoot, "dist-demo");
  const assetsDirectory = path.join(distDirectory, "assets");
  const manifestDirectory = path.join(distDirectory, ".vite");
  const entryFile = "assets/index-entry.js";

  await mkdir(scriptsDirectory, { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  await mkdir(manifestDirectory, { recursive: true });

  try {
    await copyFile(
      verifierSource,
      path.join(scriptsDirectory, "verify-demo-artifacts.mjs"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await writeFile(
    path.join(distDirectory, "index.html"),
    `<script type="module" src="${baseUrl}${entryFile}"></script>`,
  );
  await writeFile(path.join(distDirectory, entryFile), "demo entry");

  if (includeWorker) {
    await writeFile(
      path.join(distDirectory, "mockServiceWorker.js"),
      "service worker",
    );
  }

  const manifest = {
    "src/main.tsx": {
      file: entryFile,
      src: "src/main.tsx",
      isEntry: true,
      imports: entryImports,
      dynamicImports: entryDynamicImports,
    },
  };

  if (includeMswBrowserEntry) {
    manifest[mswBrowserSource] = {
      file: "assets/msw-browser.js",
      src: mswBrowserSource,
      isDynamicEntry: mswBrowserIsDynamicEntry,
    };
    await writeFile(
      path.join(distDirectory, manifest[mswBrowserSource].file),
      "MSW browser bundle",
    );
  }

  for (const [index, source] of routeSources.entries()) {
    if (source === omittedRouteSource) {
      continue;
    }

    const file = routeFiles[index];
    manifest[source] = {
      file,
      src: source,
      isDynamicEntry: source !== nonDynamicRouteSource,
    };
    await writeFile(path.join(distDirectory, file), `route ${index}`);
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
      [path.join(fixtureRoot, "scripts", "verify-demo-artifacts.mjs")],
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
    await assertion(await runVerifier(fixtureRoot), fixtureRoot);
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

test("accepts a valid repository-scoped demo artifact", async () => {
  await withFixture({}, ({ status, stderr }) => {
    assert.equal(status, 0, stderr);
  });
});

test("rejects a demo artifact without mockServiceWorker.js", async () => {
  await withFixture({ includeWorker: false }, ({ status, stderr, stdout }) => {
    assert.notEqual(status, 0, stdout);
    assert.match(stderr, /missing required MSW worker: mockServiceWorker\.js/i);
  });
});

test("rejects a demo entry built for the wrong repository base", async () => {
  await withFixture(
    { baseUrl: "/wrong-repository/" },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /expected entry URL "\/smart-logistics-auctions-spa\/assets\/index-entry\.js"/i,
      );
    },
  );
});

test("rejects a demo entry with no repository base", async () => {
  await withFixture({ baseUrl: "/" }, ({ status, stderr, stdout }) => {
    assert.notEqual(status, 0, stdout);
    assert.match(
      stderr,
      /expected entry URL "\/smart-logistics-auctions-spa\/assets\/index-entry\.js"/i,
    );
  });
});

test("rejects a missing exact MSW browser manifest entry", async () => {
  await withFixture(
    { includeMswBrowserEntry: false },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /expected one manifest chunk for MSW browser source "src\/shared\/api\/mocks\/browser\.ts", found 0/i,
      );
    },
  );
});

test("rejects an orphan MSW browser dynamic entry", async () => {
  await withFixture(
    { entryDynamicImports: routeSources },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /MSW browser source "src\/shared\/api\/mocks\/browser\.ts" is not dynamically reachable from manifest entry "src\/main\.tsx"/i,
      );
    },
  );
});

test("rejects an MSW browser source that is not a dynamic entry", async () => {
  await withFixture(
    { mswBrowserIsDynamicEntry: false },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /MSW browser source "src\/shared\/api\/mocks\/browser\.ts" is not a dynamic demo entry/i,
      );
    },
  );
});

test("rejects an eagerly reachable MSW browser chunk", async () => {
  await withFixture(
    { entryImports: [mswBrowserSource] },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /MSW browser source "src\/shared\/api\/mocks\/browser\.ts" is eagerly reachable from manifest entry "src\/main\.tsx"/i,
      );
    },
  );
});

test("uses exact route sources instead of output-name prefixes", async () => {
  await withFixture(
    {
      routeFiles: [
        "assets/chunk-1.js",
        "assets/chunk-2.js",
        "assets/chunk-3.js",
        "assets/chunk-4.js",
      ],
    },
    ({ status, stderr }) => {
      assert.equal(status, 0, stderr);
    },
  );
});

test("rejects a missing exact route source entry", async () => {
  await withFixture(
    { omittedRouteSource: routeSources.at(-1) },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /expected one manifest chunk for route source "src\/pages\/auction-bet\/auction-bet-page\.component\.tsx", found 0/i,
      );
    },
  );
});

test("rejects a route source that is not a dynamic entry", async () => {
  await withFixture(
    { nonDynamicRouteSource: routeSources.at(-1) },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /route source "src\/pages\/auction-bet\/auction-bet-page\.component\.tsx" is not a dynamic demo entry/i,
      );
    },
  );
});

test("rejects an eagerly reachable route source", async () => {
  await withFixture(
    { entryImports: [routeSources.at(-1)] },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /route source "src\/pages\/auction-bet\/auction-bet-page\.component\.tsx" is eagerly reachable from manifest entry "src\/main\.tsx"/i,
      );
    },
  );
});

test("rejects an orphan lazy route chunk", async () => {
  await withFixture(
    {
      entryDynamicImports: [mswBrowserSource, ...routeSources.slice(0, -1)],
    },
    ({ status, stderr, stdout }) => {
      assert.notEqual(status, 0, stdout);
      assert.match(
        stderr,
        /route source "src\/pages\/auction-bet\/auction-bet-page\.component\.tsx" is not dynamically reachable from manifest entry "src\/main\.tsx"/i,
      );
    },
  );
});
