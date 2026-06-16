#!/usr/bin/env node

const { spawnSync } = require('child_process');

const PUBLIC_ALIAS = 'voto-colombia-2026.vercel.app';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    if (options.capture) {
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
    }
    process.exit(result.status || 1);
  }

  return `${result.stdout || ''}${result.stderr || ''}`;
}

function findDeploymentUrl(output) {
  const deployment = parseDeploymentJson(output);
  if (deployment) {
    if (deployment.readyState && deployment.readyState !== 'READY') {
      const detail = deployment.error?.message || deployment.errorMessage || `readyState=${deployment.readyState}`;
      throw new Error(`Vercel deployment failed: ${detail}`);
    }

    if (deployment.url) {
      return deployment.url.startsWith('https://') ? deployment.url : `https://${deployment.url}`;
    }
  }

  const urls = output.match(/https:\/\/[^\s]+\.vercel\.app/g) || [];
  const productionUrl = urls.find((url) => !url.includes('/_logs') && !url.includes('vercel.com'));
  if (!productionUrl) {
    throw new Error('Could not find the Vercel deployment URL in command output.');
  }
  return productionUrl;
}

function parseDeploymentJson(output) {
  const start = output.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < output.length; index += 1) {
    const char = output[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      try {
        return JSON.parse(output.slice(start, index + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function main() {
  run('npm', ['run', 'build:full']);

  const output = run('vercel', ['--prod', '--yes'], { capture: true });
  process.stdout.write(output);

  let deploymentUrl;
  try {
    deploymentUrl = findDeploymentUrl(output);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  run('vercel', ['alias', 'set', deploymentUrl, PUBLIC_ALIAS]);
  run('npm', ['run', 'verify:prod']);
}

main();
