import { test, expect } from 'vitest';
import { configSchema } from '../src/config.js';
const sample = { version: 1, cases: [{ id: 'one', command: ['node'], input: '', requiredEnv: [], assert: { json: true } }] };
test('strict validation, bytes, duplicates and pointer escapes', () => {
  expect(configSchema.safeParse(sample).success).toBe(true);
  expect(configSchema.safeParse({ ...sample, extra: true }).success).toBe(false);
  expect(configSchema.safeParse({ ...sample, cases: [sample.cases[0], sample.cases[0]] }).success).toBe(false);
  expect(configSchema.safeParse({ ...sample, cases: [{ ...sample.cases[0], input: 'é'.repeat(8193) }] }).success).toBe(false);
  expect(configSchema.safeParse({ ...sample, cases: [{ ...sample.cases[0], assert: { fields: [{ path: '/bad~2', type: 'string' }] } }] }).success).toBe(false);
});
