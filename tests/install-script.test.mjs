import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");
const scriptPath = path.join(rootDir, "scripts/install-ai-context.mjs");

function runInstallScript(args, env) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

test("install links routing and initialization skills, then tells the user what to run next", () => {
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-skills-"));
  const env = {
    HOME: fs.mkdtempSync(path.join(os.tmpdir(), "devflow-home-")),
    AI_CONTEXT_SKILLS_HOMES: skillsHome
  };

  const install = runInstallScript(["install"], env);
  assert.equal(install.status, 0, install.stderr);
  assert.match(install.stdout, /installed skill: .*devflow/);
  assert.match(install.stdout, /installed skill: .*devflow-init/);
  assert.match(install.stdout, /devflow-init/);
  assert.equal(fs.lstatSync(path.join(skillsHome, "devflow")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(skillsHome, "devflow-init")).isSymbolicLink(), true);

  const check = runInstallScript(["check"], env);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /skill source devflow: ok/);
  assert.match(check.stdout, /skill source devflow-init: ok/);
  assert.match(check.stdout, /skill installed: yes/);

  const uninstall = runInstallScript(["uninstall"], env);
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.equal(fs.existsSync(path.join(skillsHome, "devflow")), false);
  assert.equal(fs.existsSync(path.join(skillsHome, "devflow-init")), false);
});

test("setup installs core skills and reports required workflow tools", () => {
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-setup-skills-"));
  const env = {
    HOME: fs.mkdtempSync(path.join(os.tmpdir(), "devflow-setup-home-")),
    AI_CONTEXT_SKILLS_HOMES: skillsHome
  };

  const setup = runInstallScript(["setup"], env);
  assert.equal(setup.status, 0, setup.stderr);
  assert.match(setup.stdout, /setup complete/);
  assert.match(setup.stdout, /OpenSpec/);
  assert.match(setup.stdout, /superpowers/);
  assert.equal(fs.lstatSync(path.join(skillsHome, "devflow")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(skillsHome, "devflow-init")).isSymbolicLink(), true);
});

test("doctor passes when core links, OpenSpec, and superpowers are available", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-doctor-home-"));
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-doctor-skills-"));
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-doctor-bin-"));
  const openspecPath = path.join(binDir, "openspec");
  fs.mkdirSync(path.join(home, ".codex", "superpowers"), { recursive: true });
  fs.writeFileSync(openspecPath, "#!/bin/sh\nprintf 'openspec-test\\n'\n");
  fs.chmodSync(openspecPath, 0o755);
  const env = {
    HOME: home,
    AI_CONTEXT_SKILLS_HOMES: skillsHome,
    PATH: `${binDir}${path.delimiter}/bin${path.delimiter}/usr/bin`
  };

  const setup = runInstallScript(["setup"], env);
  assert.equal(setup.status, 0, setup.stderr);

  const doctor = runInstallScript(["doctor"], env);
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.match(doctor.stdout, /ok OpenSpec CLI: openspec-test/);
  assert.match(doctor.stdout, /ok Codex superpowers:/);
  assert.match(doctor.stdout, /doctor passed/);
});

test("setup can install OpenSpec when explicitly requested", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-openspec-home-"));
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-openspec-skills-"));
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-openspec-bin-"));
  const npmLog = path.join(home, "npm.log");
  const npmPath = path.join(binDir, "npm");
  fs.writeFileSync(npmPath, `#!/bin/sh
printf "%s\\n" "$*" > "${npmLog}"
cat > "${path.join(binDir, "openspec")}" <<'EOF'
#!/bin/sh
printf 'openspec-installed\\n'
EOF
chmod +x "${path.join(binDir, "openspec")}"
`);
  fs.chmodSync(npmPath, 0o755);
  const env = {
    HOME: home,
    AI_CONTEXT_SKILLS_HOMES: skillsHome,
    PATH: `${binDir}${path.delimiter}/bin${path.delimiter}/usr/bin`
  };

  const setup = runInstallScript(["setup", "--install-openspec"], env);
  assert.equal(setup.status, 0, setup.stderr);
  assert.match(fs.readFileSync(npmLog, "utf8"), /install -g @fission-ai\/openspec@latest/);
  assert.match(setup.stdout, /ok OpenSpec CLI: openspec-installed/);
});

test("sync-projects removes legacy ai-context managed entry blocks", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-sync-home-"));
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-sync-project-"));
  const claudeEntry = path.join(projectDir, ".claude", "CLAUDE.md");
  fs.mkdirSync(path.dirname(claudeEntry), { recursive: true });
  fs.writeFileSync(claudeEntry, `# Existing notes

<!-- ai-context:managed-entry:start -->
# ai-context AI Entry

Read first:

1. config/projects/ai-context.json

<!-- ai-context:managed-entry:end -->

<!-- devflow:managed-entry:start -->
# Old DevFlow Entry
<!-- devflow:managed-entry:end -->
`);

  const sync = runInstallScript(["sync-projects", "--project", "devflow", "--entries-only", "--write"], {
    HOME: home,
    AI_CONTEXT_PROJECT_PATH_OVERRIDES: `devflow=${projectDir}`
  });

  assert.equal(sync.status, 0, sync.stderr);
  const content = fs.readFileSync(claudeEntry, "utf8");
  assert.doesNotMatch(content, /ai-context:managed-entry/);
  assert.doesNotMatch(content, /config\/projects\/ai-context\.json/);
  assert.match(content, /devflow:managed-entry:start/);
  assert.match(content, /devflow query route "<user request>"/);
  assert.match(content, /SQLite\/query migration is incomplete/);
  assert.match(content, /# Existing notes/);
});

test("sync-projects writes on-demand DevFlow routing policy into agent entries", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-routing-home-"));
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-routing-project-"));

  const sync = runInstallScript(["sync-projects", "--project", "devflow", "--entries-only", "--write"], {
    HOME: home,
    AI_CONTEXT_PROJECT_PATH_OVERRIDES: `devflow=${projectDir}`
  });

  assert.equal(sync.status, 0, sync.stderr);

  const agentsEntry = fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8");
  const claudeEntry = fs.readFileSync(path.join(projectDir, "CLAUDE.md"), "utf8");
  const cursorEntry = fs.readFileSync(path.join(projectDir, ".cursor", "rules", "00-devflow.mdc"), "utf8");

  for (const content of [agentsEntry, claudeEntry, cursorEntry]) {
    assert.match(content, /DevFlow is an on-demand capability set/i);
    assert.match(content, /Do not load all projects, scene templates, skills, rules, or task history by default/);
    assert.match(content, /devflow query route "<user request>"/);
    assert.match(content, /Read only returned readPaths and skills\.sourcePath/);
    assert.match(content, /devflow query current/);
    assert.match(content, /If devflow query is unavailable[\s\S]+SQLite\/query migration is incomplete/);
    assert.match(content, /none.*ordinary questions/i);
    assert.match(content, /resume.*current task/i);
    assert.match(content, /light.*small bug/i);
    assert.match(content, /full.*high-risk/i);
    assert.match(content, /Do not start G1-G7 by default/i);
  }
});

test("validate rejects obvious private data in public template files", () => {
  const leakFile = path.join(os.tmpdir(), `devflow-private-leak-${process.pid}.md`);
  fs.writeFileSync(leakFile, "private local path: /Users/example/Documents/private-project\n");

  let result;
  try {
    result = runInstallScript(["validate"], {
      AI_CONTEXT_PUBLIC_PRIVACY_SCAN_EXTRA_FILES: leakFile
    });
  } finally {
    fs.rmSync(leakFile, { force: true });
  }

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /public template privacy leak/i);
  assert.match(result.stderr, /absolute macOS home path/i);
});

test("validate can use caller-provided private privacy patterns", () => {
  const leakFile = path.join(os.tmpdir(), `devflow-private-pattern-${process.pid}.md`);
  fs.writeFileSync(leakFile, "private project codename: internal-order-system\n");

  let result;
  try {
    result = runInstallScript(["validate"], {
      AI_CONTEXT_PUBLIC_PRIVACY_SCAN_EXTRA_FILES: leakFile,
      AI_CONTEXT_PRIVATE_PRIVACY_PATTERNS: "internal-order-system"
    });
  } finally {
    fs.rmSync(leakFile, { force: true });
  }

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /public template privacy leak/i);
  assert.match(result.stderr, /private pattern 1/i);
});
