#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const skillSource = path.join(rootDir, "skill", "ai-context");

const managedHomes = [
  [".codex", "Codex"],
  [".claude", "Claude"],
  [".agents", "Agents"]
];

function homeRoot() {
  return process.env.AI_CONTEXT_HOME_ROOT || os.homedir();
}

function skillLinkTargets() {
  return managedHomes.map(([homeName, label]) => ({
    label,
    path: path.join(homeRoot(), homeName, "skills", "ai-context")
  }));
}

function usage() {
  return `ai-context-lite

Usage:
  ai-context-lite doctor
  ai-context-lite check
  ai-context-lite install [--dry-run] [--force]
  ai-context-lite uninstall [--dry-run]
  ai-context-lite root

Commands:
  doctor     Validate the minimal repository files and Node runtime.
  check      Show whether skill links are installed.
  install    Create skill links for supported AI tools.
  uninstall  Remove managed skill links.
  root       Print the repository root.
`;
}

function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function existsDirectory(absolutePath) {
  try {
    return fs.statSync(absolutePath).isDirectory();
  } catch {
    return false;
  }
}

function linkStatus(targetPath) {
  try {
    const stat = fs.lstatSync(targetPath);
    if (!stat.isSymbolicLink()) {
      return { state: "occupied", detail: "path exists but is not a symlink" };
    }

    const realTarget = fs.realpathSync(targetPath);
    const realSource = fs.realpathSync(skillSource);
    if (realTarget === realSource) {
      return { state: "linked", detail: `points to ${skillSource}` };
    }

    return { state: "foreign", detail: `points to ${realTarget}` };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { state: "missing", detail: "not installed" };
    }
    return { state: "error", detail: error.message };
  }
}

function assertMinimalFiles() {
  const requiredFiles = [
    "README.md",
    "package.json",
    "config/entry.json",
    "config/projects/index.json",
    "runtime/current.json",
    "skill/ai-context/SKILL.md"
  ];

  const missing = requiredFiles.filter((relativePath) => {
    return !fs.existsSync(path.join(rootDir, relativePath));
  });

  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(", ")}`);
  }

  readJson("package.json");
  readJson("config/entry.json");
  readJson("config/projects/index.json");
  readJson("runtime/current.json");
}

function runDoctor() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 18) {
    throw new Error(`Node.js 18 or newer is required. Current version: ${process.version}`);
  }

  assertMinimalFiles();
  if (!existsDirectory(skillSource)) {
    throw new Error(`Skill source directory is missing: ${skillSource}`);
  }

  console.log(`node: ${process.version}`);
  console.log(`root: ${rootDir}`);
  console.log("doctor: ok");
}

function runCheck() {
  for (const target of skillLinkTargets()) {
    const status = linkStatus(target.path);
    console.log(`${target.label}: ${status.state} - ${target.path} (${status.detail})`);
  }
}

function install({ dryRun, force }) {
  assertMinimalFiles();

  for (const target of skillLinkTargets()) {
    const status = linkStatus(target.path);
    if (status.state === "linked") {
      console.log(`${target.label}: already linked`);
      continue;
    }

    if (status.state !== "missing") {
      if (dryRun) {
        console.log(`${target.label}: would skip ${status.state} path ${target.path}`);
        continue;
      }
      if (!force) {
        throw new Error(`${target.path} is ${status.state}; rerun with --force only if you want to replace it.`);
      }
      fs.rmSync(target.path, { recursive: true, force: true });
    }

    if (dryRun) {
      console.log(`${target.label}: would link ${target.path} -> ${skillSource}`);
      continue;
    }

    fs.mkdirSync(path.dirname(target.path), { recursive: true });
    fs.symlinkSync(skillSource, target.path, "dir");
    console.log(`${target.label}: linked ${target.path}`);
  }
}

function uninstall({ dryRun }) {
  for (const target of skillLinkTargets()) {
    const status = linkStatus(target.path);
    if (status.state === "missing") {
      console.log(`${target.label}: missing`);
      continue;
    }
    if (status.state !== "linked") {
      console.log(`${target.label}: skipped ${status.state} link`);
      continue;
    }
    if (dryRun) {
      console.log(`${target.label}: would remove ${target.path}`);
      continue;
    }
    fs.rmSync(target.path, { recursive: true, force: true });
    console.log(`${target.label}: removed ${target.path}`);
  }
}

function parseOptions(args) {
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force")
  };
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = parseOptions(args);

  try {
    switch (command) {
      case "doctor":
        runDoctor();
        break;
      case "check":
        runCheck();
        break;
      case "install":
        install(options);
        break;
      case "uninstall":
        uninstall(options);
        break;
      case "root":
        console.log(rootDir);
        break;
      case undefined:
      case "help":
      case "--help":
      case "-h":
        console.log(usage());
        break;
      default:
        console.error(`Unknown command: ${command}\n`);
        console.error(usage());
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
