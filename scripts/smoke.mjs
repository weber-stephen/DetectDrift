import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const cwd = await mkdtemp(join(tmpdir(), 'driftdetect-smoke-'));
try {
  const pack = JSON.parse(execFileSync('npm', ['pack', '--json'], { encoding: 'utf8' }))[0];
  const names = pack.files.map(f => f.path);
  if (!names.includes('dist/cli.js') || !names.includes('driftdetect.schema.json')) throw new Error('CLI or schema missing from package');
  if (names.some(n => n.startsWith('test/') || n.startsWith('examples/') || n.startsWith('docs/'))) throw new Error('development files packed');
  execFileSync('npm', ['init', '-y'], { cwd, stdio: 'ignore' });
  execFileSync('npm', ['install', '--ignore-scripts', resolve(pack.filename)], { cwd, stdio: 'ignore' });
  const cli = join(cwd, 'node_modules/.bin/driftdetect');
  const example = JSON.parse(await readFile('examples/support-triage/driftdetect.json', 'utf8'));
  example.cases[0].command = ['node', 'fixture.mjs'];
  await writeFile(join(cwd, 'driftdetect.json'), JSON.stringify(example));
  await writeFile(join(cwd, 'fixture.mjs'), 'console.log(JSON.stringify({urgent:true,category:"account-access"}))');
  for (const args of [['--help'], ['check','--format','json'], ['run','--format','json']]) {
    const result = spawnSync(cli, args, { cwd, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`smoke failed: ${args}: ${result.status} ${result.stdout} ${result.stderr}`);
  }
  await writeFile(join(cwd, 'fixture.mjs'), 'console.log(JSON.stringify({urgent:"true",category:"account-access"}))');
  const wrongType = spawnSync(cli, ['run','--format','json'], { cwd, encoding: 'utf8' });
  if (wrongType.status !== 1) throw new Error(`wrong type did not fail: ${wrongType.status} ${wrongType.stdout} ${wrongType.stderr}`);
} finally { await rm(cwd, { recursive: true, force: true }); }
