import { spawn } from 'node:child_process';
import type { Config } from './config.js';
export class CommandError extends Error { constructor(public code: string) { super(code); } }
export function executeCase(testCase: Config['cases'][number], cwd: string, env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false, outBytes = 0, errBytes = 0;
    const chunks: Buffer[] = [];
    const child = spawn(testCase.command[0], testCase.command.slice(1), { cwd, env, shell: false, detached: process.platform !== 'win32', stdio: ['pipe','pipe','pipe'] });
    const fail = (code: string) => { if (settled) return; settled = true; clearTimeout(timer); if (child.pid && process.platform !== 'win32') try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); } else child.kill('SIGKILL'); reject(new CommandError(code)); };
    const timer = setTimeout(() => fail('timeout'), 30000);
    child.stdin.on('error', () => fail('exit'));
    child.stdin.end(testCase.input, 'utf8');
    child.stdout.on('data', (chunk: Buffer) => { outBytes += chunk.length; if (outBytes > 65536) fail('stdout_overflow'); else chunks.push(chunk); });
    child.stderr.on('data', (chunk: Buffer) => { errBytes += chunk.length; if (errBytes > 65536) fail('stderr_overflow'); });
    child.on('error', () => fail('launch'));
    child.on('close', code => { if (settled) return; settled = true; clearTimeout(timer); if (code !== 0) reject(new CommandError('exit')); else if (!outBytes) reject(new CommandError('empty_stdout')); else resolve(Buffer.concat(chunks).toString('utf8')); });
  });
}
