import type { Config } from './config.js';
export type CheckResult = { code: string; status: 'failed'; path?: string; reason: string };
export function evaluate(stdout: string, assertion: Config['cases'][number]['assert']): CheckResult[] {
  const failed: CheckResult[] = [];
  let json: unknown;
  if (assertion.json || assertion.fields?.length) try { json = JSON.parse(stdout); } catch { failed.push({ code: 'invalid_json', status: 'failed', reason: 'invalid JSON output' }); }
  if (!failed.length) for (const field of assertion.fields ?? []) {
    let value: unknown = json, found = true;
    for (const key of field.path.split('/').slice(1).map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'))) {
      if (value !== null && typeof value === 'object' && Object.hasOwn(value, key)) value = (value as Record<string, unknown>)[key];
      else { found = false; break; }
    }
    if (!found) failed.push({ code: 'missing_field', status: 'failed', path: field.path, reason: 'missing field' });
    else { const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
      if (actual !== field.type) failed.push({ code: 'field_type', status: 'failed', path: field.path, reason: `expected ${field.type}, got ${actual}` }); }
  }
  for (const text of assertion.contains ?? []) if (!stdout.includes(text)) failed.push({ code: 'missing_text', status: 'failed', reason: 'required text absent' });
  for (const text of assertion.notContains ?? []) if (stdout.includes(text)) failed.push({ code: 'forbidden_text', status: 'failed', reason: 'forbidden text present' });
  return failed;
}
