import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderBootstrapPage } from "./bootstrap/page.mjs";
import { runAction } from "./core/actions.mjs";
import { runChecks } from "./core/checks.mjs";
import { buildContextGraph, getNodeDetails } from "./core/graph.mjs";
import { readJsonFile } from "./core/json-loader.mjs";
import { resolveInside, toPath } from "./core/paths.mjs";

const DEFAULT_HOST = "127.0.0.1";
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};

export async function startServer({ rootDir = process.cwd(), port = 0, host = DEFAULT_HOST } = {}) {
  const rootPath = toPath(rootDir);
  const server = http.createServer((request, response) => {
    handleRequest({ request, response, rootPath }).catch((error) => {
      sendJson(response, 500, { error: { code: "server_error", message: error.message } });
    });
  });

  await new Promise((resolve) => server.listen(port, host, resolve));
  const address = server.address();
  const url = `http://${host}:${address.port}`;
  return {
    url,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

export async function handleApiRequest({ request, response, rootDir = process.cwd() }) {
  const rootPath = toPath(rootDir);
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (!url.pathname.startsWith("/api/")) {
    return false;
  }
  await handleApiRoute({ request, response, rootPath, url });
  return true;
}

async function handleRequest({ request, response, rootPath }) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    return handleApiRoute({ request, response, rootPath, url });
  }

  if (request.method !== "GET") {
    return sendJson(response, 405, { error: { code: "method_not_allowed", message: "Only GET is supported." } });
  }

  return serveAppOrBootstrap(response, rootPath, url.pathname);
}

async function handleApiRoute({ request, response, rootPath, url }) {
  if (url.pathname === "/api/graph" && request.method === "GET") {
    return sendJson(response, 200, await buildContextGraph({ rootDir: rootPath }));
  }

  if (url.pathname.startsWith("/api/nodes/") && request.method === "GET") {
    const graph = await buildContextGraph({ rootDir: rootPath });
    const nodeId = decodeURIComponent(url.pathname.slice("/api/nodes/".length));
    const details = getNodeDetails(graph, nodeId);
    return details
      ? sendJson(response, 200, details)
      : sendJson(response, 404, { error: { code: "unknown_node", message: `Unknown node: ${nodeId}` } });
  }

  if (url.pathname === "/api/checks" && request.method === "GET") {
    return sendJson(response, 200, await runChecks({ rootDir: rootPath, runCommands: false }));
  }

  if (url.pathname === "/api/profile-document" && request.method === "GET") {
    return sendJson(response, 200, await readProfileDocument(rootPath));
  }

  if (url.pathname.startsWith("/api/actions/")) {
    if (request.method !== "POST") {
      return sendJson(response, 405, { error: { code: "method_not_allowed", message: "Use POST for actions." } });
    }
    const actionId = decodeURIComponent(url.pathname.slice("/api/actions/".length));
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
      return sendJson(response, 400, { error: bodyResult.error });
    }
    const body = bodyResult.data;
    const result = await runAction({ rootDir: rootPath, actionId, body });
    return sendJson(response, result.ok ? 200 : 400, result);
  }

  return sendJson(response, 404, { error: { code: "unknown_api_route", message: `Unknown API route: ${url.pathname}` } });
}

async function readProfileDocument(rootPath) {
  const profile = await readJsonFile(resolveInside(rootPath, "config/profile.json"));
  const sourcePath = profile.data?.sourcePath || "docs/person/profile.md";
  try {
    return {
      sourcePath,
      markdown: await fs.readFile(resolveInside(rootPath, sourcePath), "utf8")
    };
  } catch (error) {
    return {
      sourcePath,
      markdown: "",
      error: { code: error?.code || "read_profile_document_failed", message: error.message }
    };
  }
}

async function serveAppOrBootstrap(response, rootPath, requestPath) {
  const distPath = path.join(rootPath, "dist/app");
  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  const candidate = path.normalize(normalized).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(distPath, candidate);

  try {
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      const ext = path.extname(filePath);
      response.writeHead(200, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
      response.end(await fs.readFile(filePath));
      return;
    }
  } catch {
    // Fall through to bootstrap or SPA fallback.
  }

  try {
    const indexPath = path.join(distPath, "index.html");
    const index = await fs.readFile(indexPath);
    response.writeHead(200, { "content-type": MIME_TYPES[".html"] });
    response.end(index);
  } catch {
    const checks = await runChecks({ rootDir: rootPath, runCommands: false });
    response.writeHead(200, { "content-type": MIME_TYPES[".html"] });
    response.end(renderBootstrapPage(checks));
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return { ok: true, data: {} };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: { code: "invalid_json", message: "Action body must be valid JSON." } };
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  const portArg = process.env.PORT ? Number(process.env.PORT) : 49321;
  const server = await startServer({ port: portArg, host: DEFAULT_HOST });
  console.log(`Context Studio: ${server.url}`);
}
