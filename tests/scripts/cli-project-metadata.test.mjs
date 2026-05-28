import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createSqliteRepository } from "../../src/core/repositories/sqlite-repository.mjs";
import { seedSqliteFromJsonFixture } from "../helpers/sqlite-fixtures.mjs";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testFile), "../..");
const cliPath = path.join(repoRoot, "scripts/devflow-cli.mjs");
const fixtureRoot = path.join(repoRoot, "tests/core/fixtures/basic-ai-context");

function copyFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-cli-project-metadata-"));
  fs.cpSync(fixtureRoot, root, { recursive: true });
  return root;
}

function runCli(rootDir, args) {
  return spawnSync(process.execPath, [cliPath, "--root", rootDir, ...args], {
    cwd: repoRoot,
    env: { ...process.env },
    encoding: "utf8"
  });
}

function parseJson(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("set-products previews and writes project products idempotently", async () => {
  const root = copyFixture();
  await seedSqliteFromJsonFixture(root);
  const repository = createSqliteRepository({ rootDir: root });

  const preview = parseJson(runCli(root, ["set-products", "demo-project", "dhb", "hxb", "--dry-run"]));
  assert.equal(preview.status, "noop");
  assert.equal(preview.action, "setProjectProducts");
  assert.deepEqual(preview.before.products, []);
  assert.deepEqual(preview.after.products, ["dhb", "hxb"]);
  assert.deepEqual((await repository.getProject("demo-project")).products, []);

  const write = parseJson(runCli(root, ["set-products", "demo-project", "dhb", "hxb"]));
  const secondWrite = parseJson(runCli(root, ["set-products", "demo-project", "dhb", "hxb"]));
  assert.equal(write.status, "ok");
  assert.equal(secondWrite.status, "noop");
  assert.deepEqual((await repository.getProject("demo-project")).products, ["dhb", "hxb"]);
});

test("set-domain and set-role write project metadata", async () => {
  const root = copyFixture();
  await seedSqliteFromJsonFixture(root);
  const repository = createSqliteRepository({ rootDir: root });

  const domain = parseJson(runCli(root, ["set-domain", "demo-project", "goods", "order"]));
  const role = parseJson(runCli(root, ["set-role", "demo-project", "bff-service"]));

  assert.equal(domain.action, "setProjectDomains");
  assert.equal(role.action, "setProjectRole");
  const project = await repository.getProject("demo-project");
  assert.deepEqual(project.domains, ["goods", "order"]);
  assert.equal(project.role, "bff-service");
});

test("metadata commands report unknown project ids", async () => {
  const root = copyFixture();
  await seedSqliteFromJsonFixture(root);

  const result = runCli(root, ["set-products", "missing-project", "dhb"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown projectId: missing-project/);
});

test("add-relation previews, writes, removes, and validates relation types", async () => {
  const root = copyFixture();
  await seedSqliteFromJsonFixture(root);
  const repository = createSqliteRepository({ rootDir: root });
  await repository.writeProject({ id: "other-project" });

  const preview = parseJson(runCli(root, ["add-relation", "demo-project", "other-project", "--type", "chain", "--dry-run"]));
  assert.equal(preview.status, "noop");
  assert.equal(preview.action, "upsertGraphEdge");
  assert.deepEqual(preview.edge, {
    from: "project:demo-project",
    to: "project:other-project",
    relation: "chain"
  });
  assert.equal((await repository.listGraphEdges()).some((edge) => edge.relation === "chain"), false);

  const write = parseJson(runCli(root, ["add-relation", "demo-project", "other-project", "--type", "chain"]));
  const secondWrite = parseJson(runCli(root, ["add-relation", "demo-project", "other-project", "--type", "chain"]));
  const remove = parseJson(runCli(root, ["add-relation", "demo-project", "other-project", "--type", "chain", "--remove"]));
  assert.equal(write.status, "ok");
  assert.equal(secondWrite.status, "noop");
  assert.equal(remove.action, "deleteGraphEdge");
  assert.equal((await repository.listGraphEdges()).some((edge) => edge.relation === "chain"), false);

  const invalid = runCli(root, ["add-relation", "demo-project", "other-project", "--type", "syncs"]);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /unsupported graph edge relation: syncs/);
});
