function ensurePreset(presetId, config) {
  const preset = (config.presets || []).find((item) => item.id === presetId);

  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }

  return preset;
}

function ensureEnvironment(environment, config) {
  const env = config.environments && config.environments[environment];

  if (!env) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  return env;
}

function buildFlags(projects) {
  const hasCash = projects.includes('dhbfront-cash-mini');
  const hasMini = projects.includes('customize-mini-program');
  const hasContainer = projects.includes('new_mobile_h5');
  const hasMobileIndex = projects.includes('dhb-mobile-index');
  const hasPackages = projects.includes('dhb-packages');

  return {
    useLocalCash: hasCash,
    useLocalMiniWebview: hasMini && hasContainer && hasMobileIndex,
    useSubpackages: hasPackages,
    askSubpackageModules: hasPackages,
  };
}

function buildCashMode(projects, config) {
  const cashRepo = config.repos && config.repos['dhbfront-cash-mini'];
  const commands = cashRepo && cashRepo.commands ? cashRepo.commands : {};
  const hasCash = projects.includes('dhbfront-cash-mini');
  const hasPackages = projects.includes('dhb-packages');

  if (!hasCash) {
    return {
      type: 'none',
      command: null,
    };
  }

  if (hasPackages) {
    return {
      type: 'subpackage',
      command: commands.subpackage || '__SUBPACKAGE_MODE__',
    };
  }

  return {
    type: 'default',
    command: commands.default || 'npm run pack_dev:h5',
  };
}

function buildRequiredMutationKeys(projects) {
  const keys = [];

  if (projects.includes('new_mobile_h5')) {
    keys.push(
      'new_mobile_h5.domainConfig',
      'new_mobile_h5.projectConfig'
    );
  }

  if (projects.includes('dhb-mobile-index')) {
    keys.push('dhb-mobile-index.domainConfig', 'dhb-mobile-index.projectConfig');
  }

  if (projects.includes('customize-mini-program')) {
    keys.push('customize-mini-program.home', 'customize-mini-program.projectConfig');
  }

  if (projects.includes('dhbfront-cash-mini')) {
    keys.push('dhbfront-cash-mini.packageJson', 'dhbfront-cash-mini.packageLock');
  }

  if (projects.includes('dhb-packages')) {
    keys.push('dhbfront-cash-mini.configIndex');
  }

  return Array.from(new Set(keys));
}

function buildExecutionPlan(options) {
  const config = options && options.config ? options.config : {};
  const preset = ensurePreset(options.presetId, config);
  const environment = ensureEnvironment(options.environment, config);
  const projects = preset.projects.slice();

  return {
    presetId: preset.id,
    presetLabel: preset.label,
    projects,
    environment,
    flags: buildFlags(projects),
    cashMode: buildCashMode(projects, config),
    requiredMutationKeys: buildRequiredMutationKeys(projects),
    selectedSubpackages: (options.selectedSubpackages || []).slice(),
  };
}

module.exports = {
  buildExecutionPlan,
};
