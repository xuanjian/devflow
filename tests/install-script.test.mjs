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
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-skills-"));
  const env = {
    HOME: fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-home-")),
    AI_CONTEXT_SKILLS_HOMES: skillsHome
  };

  const install = runInstallScript(["install"], env);
  assert.equal(install.status, 0, install.stderr);
  assert.match(install.stdout, /installed skill: .*ai-context/);
  assert.match(install.stdout, /installed skill: .*ai-context-init/);
  assert.match(install.stdout, /ai-context-init/);
  assert.equal(fs.lstatSync(path.join(skillsHome, "ai-context")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(skillsHome, "ai-context-init")).isSymbolicLink(), true);

  const check = runInstallScript(["check"], env);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /skill source ai-context: ok/);
  assert.match(check.stdout, /skill source ai-context-init: ok/);
  assert.match(check.stdout, /skill installed: yes/);

  const uninstall = runInstallScript(["uninstall"], env);
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.equal(fs.existsSync(path.join(skillsHome, "ai-context")), false);
  assert.equal(fs.existsSync(path.join(skillsHome, "ai-context-init")), false);
});

test("setup installs core skills and reports required workflow tools", () => {
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-setup-skills-"));
  const env = {
    HOME: fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-setup-home-")),
    AI_CONTEXT_SKILLS_HOMES: skillsHome
  };

  const setup = runInstallScript(["setup"], env);
  assert.equal(setup.status, 0, setup.stderr);
  assert.match(setup.stdout, /setup complete/);
  assert.match(setup.stdout, /OpenSpec/);
  assert.match(setup.stdout, /superpowers/);
  assert.equal(fs.lstatSync(path.join(skillsHome, "ai-context")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(skillsHome, "ai-context-init")).isSymbolicLink(), true);
});

test("doctor passes when core links, OpenSpec, and superpowers are available", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-doctor-home-"));
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-doctor-skills-"));
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-doctor-bin-"));
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
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-openspec-home-"));
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-openspec-skills-"));
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-openspec-bin-"));
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
