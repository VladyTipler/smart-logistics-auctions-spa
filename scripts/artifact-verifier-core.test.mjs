import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveArtifactFile } from "./artifact-verifier-core.mjs";

const artifactDirectory = path.resolve(tmpdir(), "artifact-verifier-root");

test("resolves a nested manifest file inside the artifact directory", () => {
  assert.equal(
    resolveArtifactFile(
      artifactDirectory,
      "assets/index.js",
      "test artifact",
    ),
    path.join(artifactDirectory, "assets", "index.js"),
  );
});

test("resolves a dot-prefixed file inside the artifact directory", () => {
  assert.equal(
    resolveArtifactFile(
      artifactDirectory,
      "..safe.js",
      "test artifact",
    ),
    path.join(artifactDirectory, "..safe.js"),
  );
});

for (const [caseName, manifestFile] of [
  ["parent traversal", "../outside.js"],
  ["Windows parent traversal", "..\\outside.js"],
  ["POSIX absolute path", "/outside.js"],
  ["Windows drive path", "C:\\outside.js"],
  ["Windows drive path with forward slashes", "C:/outside.js"],
  ["Windows UNC path", "\\\\server\\share\\outside.js"],
]) {
  test(`rejects a ${caseName}`, () => {
    assert.throws(
      () =>
        resolveArtifactFile(artifactDirectory, manifestFile, "test artifact"),
      /Manifest references a file outside test artifact/,
    );
  });
}
