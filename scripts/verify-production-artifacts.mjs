import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist", import.meta.url));
const manifestPath = path.join(distDirectory, ".vite", "manifest.json");
const forbiddenMarkers = ["[MSW]", "mockServiceWorker", "msw/browser"];
const routeSourceModules = [
  "src/pages/auction-list/auction-list-page.component.tsx",
  "src/pages/auction-detail/auction-detail-page.component.tsx",
  "src/pages/auction-bets/auction-bets-page.component.tsx",
  "src/pages/auction-bet/auction-bet-page.component.tsx",
];
const maxEntryChunkBytes = 500_000;

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

  if (
    relativeFile.startsWith("..") ||
    path.isAbsolute(relativeFile)
  ) {
    throw new Error(`Manifest references a file outside dist: ${file}`);
  }

  return resolvedFile;
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
  const matches = manifestEntries.filter(
    ([key, chunk]) =>
      (key === sourceModule || chunk.src === sourceModule) &&
      chunk.file.endsWith(".js"),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected one manifest chunk for route source "${sourceModule}", found ${matches.length}.`,
    );
  }

  const [key, chunk] = matches[0];

  if (chunk.isDynamicEntry !== true) {
    throw new Error(
      `Route source "${sourceModule}" is not a dynamic production entry.`,
    );
  }

  return { file: resolveDistFile(chunk.file), key, output: chunk.file };
});

const eagerlyImportedKeys = new Set();
const pendingImports = [...(entryChunk.imports ?? [])];

while (pendingImports.length > 0) {
  const importKey = pendingImports.pop();

  if (eagerlyImportedKeys.has(importKey)) {
    continue;
  }

  eagerlyImportedKeys.add(importKey);
  pendingImports.push(...(manifest[importKey]?.imports ?? []));
}

for (const routeChunk of routeChunks) {
  const chunkName = path.basename(routeChunk.file);

  if (
    indexHtml.includes(routeChunk.output) ||
    eagerlyImportedKeys.has(routeChunk.key)
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
