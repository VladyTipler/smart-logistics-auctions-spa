import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist", import.meta.url));
const forbiddenMarkers = ["[MSW]", "mockServiceWorker", "msw/browser"];
const routeChunkPrefixes = [
  "auction-list-page.component-",
  "auction-detail-page.component-",
  "auction-bets-page.component-",
  "auction-bet-page.component-",
];
const maxEntryChunkBytes = 500 * 1024;

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

const files = await listFiles(distDirectory);
const indexHtml = await readFile(path.join(distDirectory, "index.html"), "utf8");
const entryMatch = indexHtml.match(
  /<script\b[^>]*\bsrc=["']([^"']+\/index-[^"']+\.js)["'][^>]*>/i,
);

if (!entryMatch?.[1]) {
  throw new Error("Production build is missing the hashed entry module.");
}

const entryPath = path.join(
  distDirectory,
  ...entryMatch[1].replace(/^\/+/, "").split("/"),
);
const entrySize = (await stat(entryPath)).size;

if (entrySize > maxEntryChunkBytes) {
  throw new Error(
    `Production entry chunk is ${entrySize} bytes; expected at most ${maxEntryChunkBytes} bytes.`,
  );
}

const routeChunks = routeChunkPrefixes.map((prefix) => {
  const matches = files.filter(
    (file) =>
      path.basename(file).startsWith(prefix) &&
      path.extname(file).toLowerCase() === ".js",
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected one production route chunk with prefix "${prefix}", found ${matches.length}.`,
    );
  }

  return matches[0];
});

for (const routeChunk of routeChunks) {
  const chunkName = path.basename(routeChunk);

  if (indexHtml.includes(chunkName)) {
    throw new Error(
      `Route chunk "${chunkName}" is eagerly referenced by index.html.`,
    );
  }
}

const forbiddenBundle = files.find((file) =>
  /^(?:browser-.*|mockServiceWorker)\.js$/i.test(path.basename(file)),
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
