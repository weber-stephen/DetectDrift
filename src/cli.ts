#!/usr/bin/env node
import { resolve } from 'node:path';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadConfig, ConfigError } from './config.js';
import { executeCase, CommandError } from './commands.js';
import { evaluate } from './assertions.js';
import { makeReport, renderConsole, renderJson, writeActionsSummary, type CaseReport } from './report.js';
export async function main(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
  if (args.length === 1 && ['--help','-h'].includes(args[0])) { console.log('driftdetect check|run --config driftdetect.json [--format json]\nExit 0 pass, 1 assertion failure, 2 config/environment/command/report error. Schema: driftdetect.schema.json'); return 0; }
  const command = args[0], configAt = args.indexOf('--config'), formatAt = args.indexOf('--format');
  if (!['check','run'].includes(command) || args.some((a, i) => i > 0 && !['--config','--format'].includes(a) && i !== configAt + 1 && i !== formatAt + 1) || (formatAt >= 0 && args[formatAt + 1] !== 'json') || (configAt >= 0 && !args[configAt + 1])) { console.error('invalid arguments'); return 2; }
  const json = formatAt >= 0;
  try {
    const config = await loadConfig(resolve(configAt >= 0 ? args[configAt + 1] : 'driftdetect.json'));
    if (command === 'check') { const result = { schemaVersion: 1, status: 'passed', cases: config.cases.map(c => ({ id: c.id, executable: c.command[0], requiredEnv: c.requiredEnv })) }; console.log(json ? JSON.stringify(result) : result.cases.map(c => `${c.id} | ${c.executable} | ${c.requiredEnv.join(',')}`).join('\n')); return 0; }
    const missing = config.cases.flatMap(c => c.requiredEnv).find(name => !env[name]);
    if (missing) { console.error(`required environment variable missing: ${missing}`); return 2; }
    const cases: CaseReport[] = [];
    let incomplete = false;
    for (const testCase of config.cases) {
      try { const checks = evaluate(await executeCase(testCase, process.cwd(), env), testCase.assert); cases.push({ id: testCase.id, status: checks.length ? 'failed' : 'passed', checks }); }
      catch (error) { const code = error instanceof CommandError ? error.code : 'launch'; cases.push({ id: testCase.id, status: 'error', checks: [{ code, status: 'failed', reason: `command ${code}` }] }); incomplete = true; break; }
    }
    const report = makeReport(cases, incomplete);
    if (env.GITHUB_STEP_SUMMARY) try { await writeActionsSummary(report, env.GITHUB_STEP_SUMMARY); } catch { console.error('summary write failed'); return 2; }
    console.log(json ? renderJson(report) : renderConsole(report));
    return report.status === 'passed' ? 0 : report.status === 'failed' ? 1 : 2;
  } catch (error) { console.error(error instanceof ConfigError ? error.message : 'configuration error'); return 2; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) process.exitCode = await main(process.argv.slice(2));
