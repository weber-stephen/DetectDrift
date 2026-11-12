import { readFile } from 'node:fs/promises';
import { z } from 'zod';
const field = z.strictObject({ path: z.string().refine(p => p === '' || (p.startsWith('/') && !/~(?![01])/.test(p)), 'invalid JSON Pointer'), type: z.enum(['string','number','boolean','object','array','null']) });
const assertion = z.strictObject({ json: z.boolean().optional(), fields: z.array(field).optional(), contains: z.array(z.string().min(1)).optional(), notContains: z.array(z.string().min(1)).optional() }).refine(a => a.json || a.fields?.length || a.contains?.length || a.notContains?.length, 'assertion required').refine(a => new Set(a.fields?.map(f => f.path)).size === (a.fields?.length ?? 0), 'duplicate field pointer');
const item = z.strictObject({ id: z.string().regex(/^[A-Za-z0-9-]{1,64}$/), command: z.array(z.string().min(1)).min(1), input: z.string().refine(s => Buffer.byteLength(s, 'utf8') <= 16384, 'input exceeds 16 KiB'), requiredEnv: z.array(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/)).refine(a => new Set(a).size === a.length, 'duplicate environment name'), assert: assertion });
export const configSchema = z.strictObject({ version: z.literal(1), cases: z.array(item).min(1).max(10).refine(a => new Set(a.map(c => c.id)).size === a.length, 'duplicate case ID') });
export type Config = z.infer<typeof configSchema>;
export class ConfigError extends Error {}
export async function loadConfig(path: string): Promise<Config> {
  let raw: unknown;
  try { raw = JSON.parse(await readFile(path, 'utf8')); } catch { throw new ConfigError('config: cannot read valid JSON'); }
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) { const path = parsed.error.issues[0].path.join('.') || 'config'; throw new ConfigError(`${path}: invalid config${path === 'version' ? '; upgrade CLI or config version' : ''}`); }
  return parsed.data;
}
