import { appendFile } from 'node:fs/promises';
import type { CheckResult } from './assertions.js';
export type CaseReport = { id: string; status: 'passed'|'failed'|'error'; checks: CheckResult[] };
export type RunReport = { schemaVersion: 1; status: 'passed'|'failed'|'error'; counts: { passed: number; failed: number; error: number }; cases: CaseReport[] };
export function makeReport(cases: CaseReport[], incomplete = false): RunReport {
  const counts = { passed: 0, failed: 0, error: 0 };
  for (const c of cases) counts[c.status]++;
  return { schemaVersion: 1, status: incomplete || counts.error || !cases.length ? 'error' : counts.failed ? 'failed' : 'passed', counts, cases };
}
export const renderJson = (report: RunReport) => JSON.stringify(report);
export const renderConsole = (report: RunReport) => [...report.cases.map(c => `${c.id} | ${c.status.toUpperCase()}${c.checks.map(x => ` | ${x.path ?? x.code} | ${x.reason}`).join('')}`), `passed ${report.counts.passed}, failed ${report.counts.failed}, error ${report.counts.error}`].join('\n');
const escape = (s: string) => s.replace(/[\\|`*_{}\[\]()#+.!<>\r\n]/g, c => `&#${c.charCodeAt(0)};`);
export async function writeActionsSummary(report: RunReport, path: string) {
  const rows = report.cases.map(c => `| ${escape(c.id)} | ${c.status} | ${escape(c.checks.map(x => `${x.path ?? x.code}: ${x.reason}`).join('; '))} |`);
  await appendFile(path, (`## DriftDetect\n\n| Case | Status | Checks |\n| --- | --- | --- |\n${rows.join('\n')}\n\npassed ${report.counts.passed}, failed ${report.counts.failed}, error ${report.counts.error}\n`).slice(0, 16000));
}
