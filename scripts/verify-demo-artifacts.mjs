import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

import {
  collectManifestReachability,
  findManifestSourceChunk,
  listArtifactFiles,
  resolveArtifactFile,
  routeSourceModules,
} from "./artifact-verifier-core.mjs";

const distDirectory = fileURLToPath(new URL("../dist-demo", import.meta.url));
const manifestPath = path.join(distDirectory, ".vite", "manifest.json");
const repositoryBase = "/smart-logistics-auctions-spa/";
const workerFileName = "mockServiceWorker.js";
const mswBrowserSource = "src/shared/api/mocks/browser.ts";

function resolveDistFile(file) {
  return resolveArtifactFile(distDirectory, file, "dist-demo");
}

function findSourceChunk(manifestEntries, source, label) {
  const { chunk, key } = findManifestSourceChunk(
    manifestEntries,
    source,
    label,
  );

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

const files = await listArtifactFiles(distDirectory);
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

const { dynamicallyReachableKeys, eagerlyReachableKeys } =
  collectManifestReachability(manifest, entryKey);

if (!dynamicallyReachableKeys.has(mswBrowserChunk.key)) {
  throw new Error(
    `MSW browser source "${mswBrowserSource}" is not dynamically reachable from manifest entry "${entryKey}".`,
  );
}

if (
  indexHtml.includes(mswBrowserChunk.output) ||
  eagerlyReachableKeys.has(mswBrowserChunk.key)
) {
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
