import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const workflowPath = path.join(
  repositoryRoot,
  ".github",
  "workflows",
  "pages.yml",
);

test("Pages workflow keeps deployment behind the complete demo gate", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  const requiredPatterns = [
    [/\bon:\s*\n(?:(?: {2}.+\n)*) {2}push:\s*\n {4}branches:\s*\[main\]/m, "main push trigger"],
    [/^ {2}workflow_dispatch:\s*$/m, "manual trigger"],
    [/^permissions:\s*\n {2}contents:\s*read\s*\n {2}pages:\s*write\s*\n {2}id-token:\s*write\s*$/m, "minimal Pages permissions"],
    [/^concurrency:\s*\n {2}group:\s*pages\s*\n {2}cancel-in-progress:\s*false\s*$/m, "Pages concurrency"],
    [/uses:\s*actions\/checkout@v4\b/, "checkout action"],
    [/uses:\s*actions\/setup-node@v4\b[\s\S]*?node-version:\s*22\b[\s\S]*?cache:\s*npm\b/, "Node 22 npm cache"],
    [/run:\s*npm ci\b/, "dependency install"],
    [/run:\s*npm run lint\b/, "lint gate"],
    [/run:\s*npm run typecheck\b/, "typecheck gate"],
    [/run:\s*npm test\b/, "test gate"],
    [/run:\s*npx playwright install --with-deps chromium\b/, "Chromium install"],
    [/run:\s*npm run build\b/, "normal production build"],
    [/run:\s*npm run test:e2e\b/, "existing E2E gate"],
    [/run:\s*npm run test:e2e:demo\b/, "self-contained demo gate"],
    [/uses:\s*actions\/configure-pages@v5\b/, "Pages configuration"],
    [/uses:\s*actions\/upload-pages-artifact@v4\b[\s\S]*?path:\s*dist-demo\b/, "demo artifact upload"],
    [/^ {2}deploy:\s*\n {4}needs:\s*build\b/m, "deploy dependency"],
    [/^ {4}environment:\s*\n {6}name:\s*github-pages\s*\n {6}url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*\}\}\s*$/m, "protected Pages environment"],
    [/^ {8}id:\s*deployment\s*\n {8}uses:\s*actions\/deploy-pages@v4\b/m, "Pages deployment"],
  ];

  for (const [pattern, label] of requiredPatterns) {
    assert.match(workflow, pattern, `Missing ${label}.`);
  }

  assert.doesNotMatch(workflow, /\bcontinue-on-error:\s*true\b/);
});
