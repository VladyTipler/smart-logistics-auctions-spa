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

const distDirectory = fileURLToPath(new URL("../dist", import.meta.url));
const manifestPath = path.join(distDirectory, ".vite", "manifest.json");
const forbiddenMarkers = ["[MSW]", "mockServiceWorker", "msw/browser"];
const maxEntryChunkBytes = 500_000;

function resolveDistFile(file) {
  return resolveArtifactFile(distDirectory, file, "dist");
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
    `Expected one production JavaScript entry in the Vite manifest, found ${entryChunks.length}.`,
  );
}

const [entryKey, entryChunk] = entryChunks[0];
const entryPath = resolveDistFile(entryChunk.file);
const entrySize = (await stat(entryPath)).size;

if (entrySize > maxEntryChunkBytes) {
  throw new Error(
    `Production entry chunk is ${entrySize} bytes; expected at most ${maxEntryChunkBytes} bytes.`,
  );
}

const routeChunks = routeSourceModules.map((sourceModule) => {
  const { chunk, key } = findManifestSourceChunk(
    manifestEntries,
    sourceModule,
    "route source",
  );

  if (chunk.isDynamicEntry !== true) {
    throw new Error(
      `Route source "${sourceModule}" is not a dynamic production entry.`,
    );
  }

  return {
    file: resolveDistFile(chunk.file),
    key,
    output: chunk.file,
    source: sourceModule,
  };
});

const { dynamicallyReachableKeys, eagerlyReachableKeys } =
  collectManifestReachability(manifest, entryKey);

for (const routeChunk of routeChunks) {
  const chunkName = path.basename(routeChunk.file);

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
      `Route chunk "${chunkName}" is eagerly reachable from manifest entry "${entryKey}".`,
    );
  }
}

const forbiddenBundle = files.find((file) =>
  /^mockServiceWorker\.js$/i.test(path.basename(file)),
);

if (forbiddenBundle) {
  throw new Error(
    `Production build contains an MSW browser artifact: ${path.basename(forbiddenBundle)}`,
  );
}

for (const file of files.filter((file) => file.endsWith(".js"))) {
  const source = await readFile(file, "utf8");
  const marker = forbiddenMarkers.find((candidate) => source.includes(candidate));

  if (marker) {
    throw new Error(
      `Production build contains forbidden MSW marker "${marker}" in ${path.basename(file)}`,
    );
  }
}

process.stdout.write(
  `Production artifact check passed: ${routeChunks.length} lazy route chunks, ` +
    `${entrySize} byte entry, no MSW browser bundle.\n`,
);
