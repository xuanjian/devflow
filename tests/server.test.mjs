import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { handleApiRequest, startServer } from "../src/server.mjs";

test("server serves bootstrap HTML without frontend build", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const response = await fetch(`${server.url}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Context Studio/);
    assert.match(html, /Initialization/);
  } finally {
    await server.close();
  }
});

test("server exposes graph and checks APIs", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const graph = await fetch(`${server.url}/api/graph`).then((res) => res.json());
    const checks = await fetch(`${server.url}/api/checks`).then((res) => res.json());

    assert.ok(graph.nodes.length > 0);
    assert.ok(checks.checks.length > 0);
  } finally {
    await server.close();
  }
});

test("server exposes the configured profile markdown document", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const profileDocument = await fetch(`${server.url}/api/profile-document`).then((res) => res.json());

    assert.equal(profileDocument.sourcePath, "docs/person/profile.md");
    assert.match(profileDocument.markdown, /fixture collaboration preferences/i);
  } finally {
    await server.close();
  }
});

test("server returns an empty profile document when fresh install has no source path", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-context-fresh-profile-"));
  await fs.mkdir(path.join(rootDir, "config"), { recursive: true });
  await fs.writeFile(path.join(rootDir, "config/profile.json"), JSON.stringify({ version: 1 }, null, 2));
  const server = await startServer({ rootDir, port: 0 });
  try {
    const profileDocument = await fetch(`${server.url}/api/profile-document`).then((res) => res.json());

    assert.equal(profileDocument.sourcePath, "");
    assert.equal(profileDocument.markdown, "");
    assert.equal(profileDocument.empty, true);
    assert.match(profileDocument.message, /devflow-init/);
  } finally {
    await server.close();
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("server rejects unknown actions", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const response = await fetch(`${server.url}/api/actions/not_allowed`, { method: "POST", body: "{}" });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "unsupported_action");
  } finally {
    await server.close();
  }
});

test("server rejects malformed JSON action bodies", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const response = await fetch(`${server.url}/api/actions/check_ai_context`, { method: "POST", body: "{" });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "invalid_json");
  } finally {
    await server.close();
  }
});

test("handleApiRequest handles API routes for Vite middleware", async () => {
  let statusCode = 200;
  let body = "";
  const headers = {};
  const request = {
    method: "GET",
    url: "/api/graph",
    headers: { host: "127.0.0.1:5173" },
    [Symbol.asyncIterator]: async function* noop() {}
  };
  const response = {
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    writeHead(status, nextHeaders) {
      statusCode = status;
      Object.assign(headers, nextHeaders);
    },
    end(chunk = "") {
      body += chunk;
    }
  };

  const handled = await handleApiRequest({
    request,
    response,
    rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url)
  });
  const payload = JSON.parse(body);

  assert.equal(handled, true);
  assert.equal(statusCode, 200);
  assert.ok(headers["content-type"].includes("application/json"));
  assert.ok(payload.nodes.length > 0);
});
