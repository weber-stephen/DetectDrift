import { test, expect } from 'vitest';
import { executeCase } from '../src/commands.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const sample = { id: 'x', input: 'é', command: ['node','-e','process.stdin.pipe(process.stdout)'], requiredEnv: [], assert: { json: true } };
test('exact stdin and bounded stderr', async () => {
  expect(await executeCase(sample, process.cwd(), process.env)).toBe('é');
  await expect(executeCase({ ...sample, command: ['node','-e','process.stderr.write("x".repeat(70000))'] }, process.cwd(), process.env)).rejects.toMatchObject({ code: 'stderr_overflow' });
});

test.skipIf(process.platform === 'win32')('stops subprocesses when output exceeds the limit', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'driftdetect-child-'));
  const marker = join(dir, 'survived');
  const grandchild = `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'alive')`;
  const parent = `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => { ${grandchild} }, 500)`) }], { stdio: 'ignore' }); setTimeout(() => process.stdout.write('x'.repeat(70000)), 100)`;
  try {
    await expect(executeCase({ ...sample, command: [process.execPath, '-e', parent] }, process.cwd(), process.env)).rejects.toMatchObject({ code: 'stdout_overflow' });
    await new Promise(resolve => setTimeout(resolve, 700));
    await expect(readFile(marker)).rejects.toMatchObject({ code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
