import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist", import.meta.url));
const forbiddenMarkers = ["[MSW]", "mockServiceWorker", "msw/browser"];

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
  "Production artifact check passed: no MSW browser bundle.\n",
);
