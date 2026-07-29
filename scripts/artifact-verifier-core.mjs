import { readdir } from "node:fs/promises";
import path from "node:path";

export const routeSourceModules = Object.freeze([
  "src/pages/auction-list/auction-list-page.component.tsx",
  "src/pages/auction-detail/auction-detail-page.component.tsx",
  "src/pages/auction-bets/auction-bets-page.component.tsx",
  "src/pages/auction-bet/auction-bet-page.component.tsx",
]);

export async function listArtifactFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listArtifactFiles(entryPath) : entryPath;
    }),
  );

  return files.flat();
}

export function resolveArtifactFile(distDirectory, file, artifactName) {
  const normalisedFile = file.replaceAll("\\", "/");

  if (normalisedFile.startsWith("/") || /^[A-Za-z]:/.test(normalisedFile)) {
    throw new Error(
      `Manifest references a file outside ${artifactName}: ${file}`,
    );
  }

  const resolvedFile = path.resolve(
    distDirectory,
    ...normalisedFile.split("/"),
  );
  const relativeFile = path.relative(distDirectory, resolvedFile);

  if (
    relativeFile === ".." ||
    relativeFile.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeFile)
  ) {
    throw new Error(
      `Manifest references a file outside ${artifactName}: ${file}`,
    );
  }

  return resolvedFile;
}

export function findManifestSourceChunk(manifestEntries, source, label) {
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

  return { chunk, key };
}

export function collectManifestReachability(manifest, entryKey) {
  const dynamicallyReachableKeys = new Set();
  const eagerlyReachableKeys = new Set();
  const visitedReachabilityStates = new Set();
  const pendingImports = [{ key: entryKey, reachedDynamically: false }];

  while (pendingImports.length > 0) {
    const { key, reachedDynamically } = pendingImports.pop();
    const reachabilityState =
      `${reachedDynamically ? "dynamic" : "eager"}:${key}`;

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

  return { dynamicallyReachableKeys, eagerlyReachableKeys };
}
