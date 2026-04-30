const assert = require('assert').strict;
const { execFileSync } = require('child_process');

const { buildExecutionPlan } = require('./run-projects.core');
const runtimeConfig = require('./presets.json');

const config = {
  presets: [
    {
      id: 'preset-2',
      label: 'packages + cash + mobile-index + new_mobile_h5',
      projects: ['dhb-packages', 'dhbfront-cash-mini', 'dhb-mobile-index', 'new_mobile_h5'],
    },
    {
      id: 'preset-4',
      label: 'cash + mobile-index + new_mobile_h5 + customize-mini-program',
      projects: ['dhbfront-cash-mini', 'dhb-mobile-index', 'new_mobile_h5', 'customize-mini-program'],
    },
    {
      id: 'preset-6',
      label: 'mobile-index + new_mobile_h5',
      projects: ['dhb-mobile-index', 'new_mobile_h5'],
    },
  ],
  environments: {
    test: {
      label: '测试',
      h5EnvCode: 'test',
      miniBeforeCompile: 'env=stage',
    },
    release: {
      label: '预发',
      h5EnvCode: 'release',
      miniBeforeCompile: 'env=release',
    },
    online: {
      label: '线上',
      h5EnvCode: 'online',
      miniBeforeCompile: 'env=master',
    },
  },
};

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

runTest('preset 4 + test resolves local cash and local h5 wiring', () => {
  const plan = buildExecutionPlan({
    presetId: 'preset-4',
    environment: 'test',
    config,
  });

  assert.deepEqual(plan.projects, [
    'dhbfront-cash-mini',
    'dhb-mobile-index',
    'new_mobile_h5',
    'customize-mini-program',
  ]);
  assert.equal(plan.environment.h5EnvCode, 'test');
  assert.equal(plan.flags.useLocalCash, true);
  assert.equal(plan.flags.useLocalMiniWebview, true);
  assert.equal(plan.flags.askSubpackageModules, false);
});

runTest('preset with dhb-packages switches cash to subpackage mode', () => {
  const plan = buildExecutionPlan({
    presetId: 'preset-2',
    environment: 'release',
    config,
    selectedSubpackages: ['taro-goods-poster'],
  });

  assert.equal(plan.flags.useSubpackages, true);
  assert.equal(plan.flags.askSubpackageModules, true);
  assert.deepEqual(plan.selectedSubpackages, ['taro-goods-poster']);
});

runTest('preset 6 only starts mobile-index and new_mobile_h5', () => {
  const plan = buildExecutionPlan({
    presetId: 'preset-6',
    environment: 'online',
    config,
  });

  assert.deepEqual(plan.projects, ['dhb-mobile-index', 'new_mobile_h5']);
  assert.equal(plan.environment.h5EnvCode, 'online');
  assert.equal(plan.flags.useLocalCash, false);
  assert.equal(plan.flags.useLocalMiniWebview, false);
  assert.equal(plan.flags.askSubpackageModules, false);
});

runTest('runtime config exposes three environments and package presets', () => {
  assert.deepEqual(Object.keys(runtimeConfig.environments), ['test', 'release', 'online']);
  assert.ok(runtimeConfig.presets.some((item) => item.id === 'preset-1'));
  assert.ok(runtimeConfig.presets.some((item) => item.id === 'preset-2'));
});

runTest('runtime config defines subpackage css transform mapping', () => {
  assert.equal(
    runtimeConfig.subpackages['taro-goods-poster'].cssTransformPath,
    '**/taro-goods-poster/**'
  );
});

runTest('runtime config uses pnpm for subpackage build and watch', () => {
  assert.equal(runtimeConfig.subpackages['taro-goods-poster'].buildCommand, 'pnpm run build');
  assert.equal(runtimeConfig.subpackages['taro-goods-poster'].watchCommand, 'pnpm run build:watch');
  assert.equal(runtimeConfig.subpackages['taro-goods-modal'].buildCommand, 'pnpm run build');
});

runTest('runtime plan uses pack_dev:h5 for non-package cash flow', () => {
  const plan = buildExecutionPlan({
    presetId: 'preset-4',
    environment: 'test',
    config: runtimeConfig,
  });

  assert.equal(plan.cashMode.type, 'default');
  assert.equal(plan.cashMode.command, 'npm run pack_dev:h5');
});

runTest('runtime plan uses subpackage mode when dhb-packages is selected', () => {
  const plan = buildExecutionPlan({
    presetId: 'preset-2',
    environment: 'test',
    config: runtimeConfig,
    selectedSubpackages: ['taro-goods-poster'],
  });

  assert.equal(plan.cashMode.type, 'subpackage');
  assert.equal(plan.cashMode.command, 'npm run pack:h5:watch_with_subpackages');
  assert.ok(plan.requiredMutationKeys.includes('dhbfront-cash-mini.configIndex'));
});

runTest('subpackage dry-run does not auto install dependencies', () => {
  const output = execFileSync(
    process.execPath,
    [
      '/Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js',
      '--preset',
      'preset-2',
      '--env',
      'test',
      '--subpackages',
      'taro-goods-combine',
      '--dry-run',
    ],
    { encoding: 'utf8' }
  );

  const summary = JSON.parse(output);
  const installActions = summary.actions.filter((item) => item.type === 'install');
  assert.equal(installActions.length, 0);
});
