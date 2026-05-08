import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../src/server.mjs";

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
