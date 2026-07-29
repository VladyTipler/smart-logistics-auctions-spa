import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist-demo", import.meta.url));
const manifestPath = path.join(distDirectory, ".vite", "manifest.json");
const repositoryBase = "/smart-logistics-auctions-spa/";
const workerFileName = "mockServiceWorker.js";
const mswBrowserSource = "src/shared/api/mocks/browser.ts";
const routeSourceModules = [
  "src/pages/auction-list/auction-list-page.component.tsx",
  "src/pages/auction-detail/auction-detail-page.component.tsx",
  "src/pages/auction-bets/auction-bets-page.component.tsx",
  "src/pages/auction-bet/auction-bet-page.component.tsx",
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : entryPath;
    }),
  );

  return files.flat();
}

function resolveDistFile(file) {
  const normalisedFile = file.replaceAll("\\", "/").replace(/^\/+/, "");
  const resolvedFile = path.resolve(
    distDirectory,
    ...normalisedFile.split("/"),
  );
  const relativeFile = path.relative(distDirectory, resolvedFile);

  if (relativeFile.startsWith("..") || path.isAbsolute(relativeFile)) {
    throw new Error(`Manifest references a file outside dist-demo: ${file}`);
  }

  return resolvedFile;
}

function findSourceChunk(manifestEntries, source, label) {
  const matches = manifestEntries.filter(
    ([key, chunk]) =>
      (key === source || chunk.src === source) && chunk.file.endsWith(".js"),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected one manifest chunk for ${label} "${source}", found ${matches.length}.`,
    );
  }

  const [key, chunk] = matches[0];

  if (chunk.isDynamicEntry !== true) {
    throw new Error(
      `${label[0].toUpperCase()}${label.slice(1)} "${source}" is not a dynamic demo entry.`,
    );
  }

  return {
    file: resolveDistFile(chunk.file),
    key,
    output: chunk.file,
    source,
  };
}

const files = await listFiles(distDirectory);
const indexHtml = await readFile(path.join(distDirectory, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const manifestEntries = Object.entries(manifest);
const entryChunks = manifestEntries.filter(
  ([, chunk]) => chunk.isEntry === true && chunk.file.endsWith(".js"),
);

if (entryChunks.length !== 1) {
  throw new Error(
    `Expected one demo JavaScript entry in the Vite manifest, found ${entryChunks.length}.`,
  );
}

const [entryKey, entryChunk] = entryChunks[0];
const entryPath = resolveDistFile(entryChunk.file);
const expectedEntryUrl =
  repositoryBase + entryChunk.file.replaceAll("\\", "/").replace(/^\/+/, "");

if (
  !indexHtml.includes(`src="${expectedEntryUrl}"`) &&
  !indexHtml.includes(`src='${expectedEntryUrl}'`)
) {
  throw new Error(
    `Demo index expected entry URL "${expectedEntryUrl}" under the repository base.`,
  );
}

if (!files.includes(path.join(distDirectory, workerFileName))) {
  throw new Error(
    `Demo artifact is missing required MSW worker: ${workerFileName}.`,
  );
}

await stat(entryPath);

const mswBrowserChunk = findSourceChunk(
  manifestEntries,
  mswBrowserSource,
  "MSW browser source",
);
const routeChunks = routeSourceModules.map((source) =>
  findSourceChunk(manifestEntries, source, "route source"),
);

const dynamicallyReachableKeys = new Set();
const eagerlyReachableKeys = new Set();
const visitedReachabilityStates = new Set();
const pendingImports = [{ key: entryKey, reachedDynamically: false }];

while (pendingImports.length > 0) {
  const { key, reachedDynamically } = pendingImports.pop();
  const reachabilityState = `${reachedDynamically ? "dynamic" : "eager"}:${key}`;

  if (visitedReachabilityStates.has(reachabilityState)) {
    continue;
  }

  visitedReachabilityStates.add(reachabilityState);

  if (key !== entryKey) {
    if (reachedDynamically) {
      dynamicallyReachableKeys.add(key);
    } else {
      eagerlyReachableKeys.add(key);
    }
  }

  const chunk = manifest[key];

  for (const importKey of chunk?.imports ?? []) {
    pendingImports.push({ key: importKey, reachedDynamically });
  }

  for (const importKey of chunk?.dynamicImports ?? []) {
    pendingImports.push({ key: importKey, reachedDynamically: true });
  }
}

if (!dynamicallyReachableKeys.has(mswBrowserChunk.key)) {
  throw new Error(
    `MSW browser source "${mswBrowserSource}" is not dynamically reachable from manifest entry "${entryKey}".`,
  );
}

if (eagerlyReachableKeys.has(mswBrowserChunk.key)) {
  throw new Error(
    `MSW browser source "${mswBrowserSource}" is eagerly reachable from manifest entry "${entryKey}".`,
  );
}

await stat(mswBrowserChunk.file);

for (const routeChunk of routeChunks) {
  if (!dynamicallyReachableKeys.has(routeChunk.key)) {
    throw new Error(
      `Route source "${routeChunk.source}" is not dynamically reachable from manifest entry "${entryKey}".`,
    );
  }

  if (
    indexHtml.includes(routeChunk.output) ||
    eagerlyReachableKeys.has(routeChunk.key)
  ) {
    throw new Error(
      `Route source "${routeChunk.source}" is eagerly reachable from manifest entry "${entryKey}".`,
    );
  }

  await stat(routeChunk.file);
}

process.stdout.write(
  `Demo artifact check passed: repository base, MSW worker/browser, ` +
    `${routeChunks.length} lazy route chunks.\n`,
);
